#!/usr/bin/env python3
"""
Extrator de Relatório de Vendas - Magento 2 REST API (OAuth 1.0a)
Gera relatório diário de pedidos com detalhes de produtos, categorias e vendedoras.

Uso:
    python3 requisicao.py                              # Ontem (padrão)
    python3 requisicao.py --data-inicio 2026-01-01 --data-fim 2026-01-31
    python3 requisicao.py --sep ";"                    # Separador customizado
"""

import argparse
import csv
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional
from zoneinfo import ZoneInfo

import requests
from requests_oauthlib import OAuth1
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from urllib3.util.retry import Retry

# =============================================================================
# CONFIGURAÇÃO
# =============================================================================

# Carregar .env.local priorizando keys de OAuth
load_dotenv('.env.local')
load_dotenv() # Fallback para .env

BASE_URL = os.getenv("MAGENTO_BASE_URL", "").rstrip("/")

# OAuth 1.0a Credentials
CONSUMER_KEY = os.getenv("MAGENTO_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("MAGENTO_CONSUMER_SECRET")
ACCESS_TOKEN = os.getenv("MAGENTO_ACCESS_TOKEN")
TOKEN_SECRET = os.getenv("MAGENTO_ACCESS_TOKEN_SECRET")

TIMEZONE = ZoneInfo("America/Sao_Paulo")
PAGE_SIZE = 100
REQUEST_TIMEOUT = 60

# Diretórios
BASE_DIR = Path(__file__).parent
REPORTS_DIR = BASE_DIR / "reports"
LOGS_DIR = BASE_DIR / "logs"

REPORTS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# =============================================================================
# LOGGING
# =============================================================================

def setup_logging() -> logging.Logger:
    """Configura logging para arquivo e console."""
    logger = logging.getLogger("report_sales")
    logger.setLevel(logging.DEBUG)
    
    # Formato
    fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Handler arquivo
    fh = logging.FileHandler(LOGS_DIR / "relatorio_vendas.log", encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    
    # Handler console
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    
    logger.addHandler(fh)
    logger.addHandler(ch)
    
    return logger

logger = setup_logging()

# =============================================================================
# HTTP SESSION (OAuth 1.0a)
# =============================================================================

def create_session() -> requests.Session:
    """Cria session com retry automático e autenticação OAuth 1.0a."""
    session = requests.Session()
    
    # OAuth 1.0a
    if all([CONSUMER_KEY, CONSUMER_SECRET, ACCESS_TOKEN, TOKEN_SECRET]):
        logger.info("Configurando autenticação OAuth 1.0a...")
        from oauthlib.oauth1 import SIGNATURE_HMAC_SHA256
        auth = OAuth1(
            CONSUMER_KEY,
            client_secret=CONSUMER_SECRET,
            resource_owner_key=ACCESS_TOKEN,
            resource_owner_secret=TOKEN_SECRET,
            signature_method=SIGNATURE_HMAC_SHA256,
        )
        session.auth = auth
    else:
        logger.warning("Credenciais OAuth incompletas. Verifique o .env.local")
        # Fallback para Basic Auth se definido (apenas homologação/dev)
        basic_user = os.getenv("MAGENTO_BASIC_USER")
        basic_pass = os.getenv("MAGENTO_BASIC_PASS")
        if basic_user and basic_pass:
            session.auth = (basic_user, basic_pass)
    
    # Retry strategy
    retry_strategy = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    
    return session

session = create_session()

# =============================================================================
# CACHE
# =============================================================================

_cache_products: dict[str, dict] = {}
_cache_categories: dict[int, str] = {}
_cache_status_map: dict[str, str] = {}
_cache_saleswoman_options: dict[str, str] = {}

# =============================================================================
# FUNÇÕES DE API
# =============================================================================

def magento_get(endpoint: str, params: Optional[dict] = None) -> Any:
    """
    Faz GET autenticado na API do Magento.
    """
    url = f"{BASE_URL}/rest/default/V1/{endpoint.lstrip('/')}"
    # Remove /rest/default/V1 se o BASE_URL já tiver
    if "rest" in BASE_URL:
         url = f"{BASE_URL}/{endpoint.lstrip('/')}"
    
    # Check if BASE_URL ends with V1 to avoid duplication
    if BASE_URL.endswith("V1"):
         url = f"{BASE_URL}/{endpoint.lstrip('/')}"
    else:
         url = f"{BASE_URL}/rest/default/V1/{endpoint.lstrip('/')}"

    logger.debug(f"GET {endpoint} params={params}")
    
    # Manually encode params to ensure spaces are %20 not +
    if params:
        from urllib.parse import urlencode, quote
        query_string = urlencode(params, quote_via=quote)
        if "?" in url:
            url = f"{url}&{query_string}"
        else:
            url = f"{url}?{query_string}"
        params = None # Clear params so requests doesn't append them again

    resp = session.get(url, params=params, timeout=REQUEST_TIMEOUT)
    
    if resp.status_code >= 400:
        logger.error(f"Erro {resp.status_code}: {resp.text}")
    
    resp.raise_for_status()
    
    return resp.json()


def load_status_map() -> dict[str, str]:
    """Carrega mapa de status_code -> label."""
    global _cache_status_map
    
    if _cache_status_map:
        return _cache_status_map
    
    logger.info("Carregando mapa de status de pedidos...")
    
    try:
        # Magento 2.4+ endpoint
        statuses = magento_get("orders/statuses")
        
        # Response: [{"status": "pending", "label": "Pendente"}, ...]
        for s in statuses:
            code = s.get("status", "")
            label = s.get("label", code)
            _cache_status_map[code] = label
            
    except requests.HTTPError as e:
        # Fallback: tentar outro endpoint
        logger.warning(f"Endpoint /orders/statuses falhou ({e}), tentando alternativa...")
        
        try:
            # Alternativa comum
            statuses = magento_get("order/statuses")
            for s in statuses:
                code = s.get("status", "")
                label = s.get("label", code)
                _cache_status_map[code] = label
        except Exception:
            logger.warning("Não foi possível carregar labels de status; usando codes")
    
    logger.info(f"  -> {len(_cache_status_map)} status carregados")
    return _cache_status_map


def load_saleswoman_options() -> dict[str, str]:
    """Carrega opções do atributo 'saleswoman' (option_id -> label)."""
    global _cache_saleswoman_options
    
    if _cache_saleswoman_options:
        return _cache_saleswoman_options
    
    logger.info("Carregando opções do atributo saleswoman...")
    
    try:
        options = magento_get("products/attributes/saleswoman/options")
        
        # Response: [{"value": "123", "label": "Maria"}, ...]
        for opt in options:
            val = str(opt.get("value", ""))
            label = opt.get("label", "")
            if val and label:
                _cache_saleswoman_options[val] = label
                
    except requests.HTTPError as e:
        logger.warning(f"Não foi possível carregar opções de saleswoman: {e}")
    
    logger.info(f"  -> {len(_cache_saleswoman_options)} opções carregadas")
    return _cache_saleswoman_options


def fetch_orders(date_start: datetime, date_end: datetime) -> list[dict]:
    """
    Busca pedidos no intervalo [date_start, date_end).
    Pagina automaticamente.
    """
    all_orders = []
    current_page = 1
    
    # Formatar datas para API (ISO 8601)
    # Magento espera: YYYY-MM-DD HH:MM:SS
    start_str = date_start.strftime("%Y-%m-%d %H:%M:%S")
    end_str = date_end.strftime("%Y-%m-%d %H:%M:%S")
    
    logger.info(f"Buscando pedidos de {start_str} até {end_str}...")
    
    while True:
        params = {
            "searchCriteria[filter_groups][0][filters][0][field]": "created_at",
            "searchCriteria[filter_groups][0][filters][0][value]": start_str,
            "searchCriteria[filter_groups][0][filters][0][condition_type]": "gteq",
            "searchCriteria[filter_groups][1][filters][0][field]": "created_at",
            "searchCriteria[filter_groups][1][filters][0][value]": end_str,
            "searchCriteria[filter_groups][1][filters][0][condition_type]": "lt",
            "searchCriteria[pageSize]": PAGE_SIZE,
            "searchCriteria[currentPage]": current_page,
            "searchCriteria[sortOrders][0][field]": "created_at",
            "searchCriteria[sortOrders][0][direction]": "ASC",
        }
        
        data = magento_get("orders", params)
        
        items = data.get("items", [])
        total_count = data.get("total_count", 0)
        
        all_orders.extend(items)
        
        logger.info(f"  Página {current_page}: {len(items)} pedidos (total: {len(all_orders)}/{total_count})")
        
        # Verificar se há mais páginas
        if len(all_orders) >= total_count or len(items) == 0:
            break
        
        current_page += 1
    
    logger.info(f"Total de pedidos carregados: {len(all_orders)}")
    return all_orders


def fetch_product(sku: str) -> dict:
    """Busca produto por SKU com cache."""
    if sku in _cache_products:
        return _cache_products[sku]
    
    logger.debug(f"Buscando produto SKU: {sku}")
    
    try:
        # SKU pode ter caracteres especiais, encode
        sku_encoded = requests.utils.quote(sku, safe="")
        product = magento_get(f"products/{sku_encoded}")
        _cache_products[sku] = product
        return product
        
    except requests.HTTPError as e:
        logger.warning(f"Produto SKU '{sku}' não encontrado: {e}")
        _cache_products[sku] = {}
        return {}


def fetch_category_name(cat_id: int) -> str:
    """Busca nome da categoria por ID com cache."""
    if cat_id in _cache_categories:
        return _cache_categories[cat_id]
    
    logger.debug(f"Buscando categoria ID: {cat_id}")
    
    try:
        cat = magento_get(f"categories/{cat_id}")
        name = cat.get("name", "")
        _cache_categories[cat_id] = name
        return name
        
    except requests.HTTPError:
        logger.warning(f"Categoria ID {cat_id} não encontrada")
        _cache_categories[cat_id] = ""
        return ""


def get_product_attribute(product: dict, attr_code: str) -> Optional[str]:
    """Extrai valor de custom_attribute do produto."""
    custom_attrs = product.get("custom_attributes", [])
    
    for attr in custom_attrs:
        if attr.get("attribute_code") == attr_code:
            return str(attr.get("value", ""))
    
    return None


def get_product_categories(product: dict) -> str:
    """
    Obtém categorias do produto, concatenadas, distintas, ordenadas.
    Retorna string separada por ", ".
    """
    ext_attrs = product.get("extension_attributes", {})
    cat_links = ext_attrs.get("category_links", [])
    
    if not cat_links:
        return ""
    
    category_names = set()
    
    for link in cat_links:
        cat_id = link.get("category_id")
        if cat_id:
            name = fetch_category_name(int(cat_id))
            if name:
                category_names.add(name)
    
    # Ordenar alfabeticamente e concatenar
    return ", ".join(sorted(category_names))


def get_saleswoman_label(product: dict) -> str:
    """Obtém label da vendedora do produto."""
    options = load_saleswoman_options()
    
    value = get_product_attribute(product, "saleswoman")
    
    if not value:
        return ""
    
    # Pode ser option_id ou já ser o label
    return options.get(value, value)


def build_rows(orders: list[dict]) -> list[dict]:
    """
    Constrói as linhas do relatório a partir dos pedidos.
    Cada linha = (pedido, item visível).
    """
    load_status_map()
    load_saleswoman_options()
    
    rows = []
    
    for order in orders:
        increment_id = order.get("increment_id", "")
        created_at = order.get("created_at", "")
        status_code = order.get("status", "")
        status_label = _cache_status_map.get(status_code, status_code)
        
        grand_total = float(order.get("grand_total", 0) or 0)
        shipping_amount = float(order.get("shipping_amount", 0) or 0)
        valor_sem_frete = grand_total - shipping_amount
        
        customer_email = order.get("customer_email", "")
        customer_taxvat = order.get("customer_taxvat", "") or ""
        
        # Billing address
        billing = order.get("billing_address", {}) or {}
        cidade = billing.get("city", "")
        estado = billing.get("region", "")
        
        # Itens do pedido
        items = order.get("items", [])
        
        for item in items:
            # Ignorar itens que são filhos (configuráveis/bundles)
            parent_id = item.get("parent_item_id")
            if parent_id:
                continue
            
            item_name = item.get("name", "")
            row_total = float(item.get("row_total", 0) or 0)
            sku = item.get("sku", "")
            
            # Buscar produto para MPN, Categorias, Vendedora
            product = fetch_product(sku) if sku else {}
            
            mpn = get_product_attribute(product, "mpn") or ""
            categorias = get_product_categories(product)
            vendedora = get_saleswoman_label(product)
            
            row = {
                "MPN": mpn,
                "Nº Transação": increment_id,
                "Data Transação": created_at,
                "Status": status_label,
                "Nome do Produto": item_name,
                "Receita do Produto": row_total,
                "Cidade": cidade,
                "Estado": estado,
                "Valor total sem frete": valor_sem_frete,
                "Valor total com frete": grand_total,
                "E-mail cliente": customer_email,
                "CPF Cliente": customer_taxvat,
                "Categorias": categorias,
                "Vendedora": vendedora,
            }
            
            rows.append(row)
    
    # Ordenar por Data Transação
    rows.sort(key=lambda r: r.get("Data Transação", ""))
    
    logger.info(f"Total de linhas geradas: {len(rows)}")
    return rows


def write_csv(rows: list[dict], date_start: str, date_end: str, sep: str = ",") -> Path:
    """Escreve o CSV no diretório reports."""
    filename = f"relatorio_vendas_{date_start}_{date_end}.csv"
    filepath = REPORTS_DIR / filename
    
    columns = [
        "MPN",
        "Nº Transação",
        "Data Transação",
        "Status",
        "Nome do Produto",
        "Receita do Produto",
        "Cidade",
        "Estado",
        "Valor total sem frete",
        "Valor total com frete",
        "E-mail cliente",
        "CPF Cliente",
        "Categorias",
        "Vendedora",
    ]
    
    logger.info(f"Escrevendo CSV: {filepath}")
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns, delimiter=sep)
        writer.writeheader()
        writer.writerows(rows)
    
    logger.info(f"CSV salvo com {len(rows)} linhas")
    return filepath


# =============================================================================
# CLI
# =============================================================================

def parse_args() -> argparse.Namespace:
    """Parse argumentos de linha de comando."""
    parser = argparse.ArgumentParser(
        description="Gera relatório de vendas do Magento",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    
    parser.add_argument(
        "--data-inicio",
        type=str,
        help="Data início (YYYY-MM-DD). Padrão: ontem",
    )
    parser.add_argument(
        "--data-fim",
        type=str,
        help="Data fim (YYYY-MM-DD). Padrão: ontem",
    )
    parser.add_argument(
        "--sep",
        type=str,
        default=",",
        help="Separador do CSV (padrão: vírgula)",
    )
    
    return parser.parse_args()


def main():
    """Função principal."""
    args = parse_args()
    
    # Validar configuração
    if not all([BASE_URL]):
         logger.error("BASE_URL não configurada no .env")
         sys.exit(1)

    if not all([CONSUMER_KEY, CONSUMER_SECRET, ACCESS_TOKEN, TOKEN_SECRET]):
        logger.error("Credenciais OAuth incompletas. Configure MAGENTO_CONSUMER_KEY, etc em .env.local")
        sys.exit(1)
    
    # Determinar datas
    hoje = datetime.now(TIMEZONE).replace(hour=0, minute=0, second=0, microsecond=0)
    ontem = hoje - timedelta(days=1)
    
    if args.data_inicio:
        data_inicio = datetime.strptime(args.data_inicio, "%Y-%m-%d").replace(tzinfo=TIMEZONE)
    else:
        data_inicio = ontem
    
    if args.data_fim:
        data_fim = datetime.strptime(args.data_fim, "%Y-%m-%d").replace(tzinfo=TIMEZONE)
    else:
        data_fim = ontem
    
    # Ajustar para intervalo inclusivo: data_fim + 1 dia (00:00:00)
    data_fim_exclusive = (data_fim + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    data_inicio = data_inicio.replace(hour=0, minute=0, second=0, microsecond=0)
    
    logger.info("=" * 60)
    logger.info("RELATÓRIO DE VENDAS - MAGENTO")
    logger.info(f"Período: {data_inicio.strftime('%Y-%m-%d')} a {data_fim.strftime('%Y-%m-%d')}")
    logger.info("=" * 60)
    
    try:
        # 1. Buscar pedidos
        orders = fetch_orders(data_inicio, data_fim_exclusive)
        
        if not orders:
            logger.warning("Nenhum pedido encontrado no período")
            sys.exit(0)
        
        # 2. Construir linhas
        rows = build_rows(orders)
        
        if not rows:
            logger.warning("Nenhuma linha gerada (pedidos sem itens válidos?)")
            sys.exit(0)
        
        # 3. Escrever CSV
        filepath = write_csv(
            rows,
            data_inicio.strftime("%Y-%m-%d"),
            data_fim.strftime("%Y-%m-%d"),
            sep=args.sep,
        )
        
        logger.info("=" * 60)
        logger.info(f"CONCLUÍDO! Arquivo: {filepath}")
        logger.info("=" * 60)
        
    except requests.HTTPError as e:
        logger.error(f"Erro de API: {e}")
        logger.error(f"Response: {e.response.text if e.response else 'N/A'}")
        sys.exit(1)
    except Exception as e:
        logger.exception(f"Erro inesperado: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()