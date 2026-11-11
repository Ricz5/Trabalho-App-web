// ===== Datas da pesquisa (só index.html) =====
function hojeISO() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
}

const dataLevantamento = document.getElementById('data-levantamento');
const dataDevolucao = document.getElementById('data-devolucao');

if (dataLevantamento && dataDevolucao) {
    const hoje = hojeISO();
    dataLevantamento.min = hoje;
    dataDevolucao.min = hoje;

    dataLevantamento.addEventListener('change', () => {
        // A devolução nunca pode ser antes do levantamento
        dataDevolucao.min = dataLevantamento.value || hoje;
        if (dataDevolucao.value && dataDevolucao.value < dataDevolucao.min) {
            dataDevolucao.value = '';
        }
    });
}

// ===== Filtro da frota (só frota.html) =====
const btnFiltrar = document.getElementById('btn-filtrar');

if (btnFiltrar) {
    const selLocal = document.getElementById('filtro-localizacao');
    const selCategoria = document.getElementById('filtro-categoria');
    const selPreco = document.getElementById('filtro-preco');
    const semResultados = document.getElementById('sem-resultados');
    const resumo = document.getElementById('resumo-pesquisa');

    function formatarData(iso) {
        const [ano, mes, dia] = iso.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function aplicarFiltros() {
        const local = selLocal.value;
        const categoria = selCategoria.value;
        const preco = selPreco.value;

        let limite = Infinity;
        if (preco.includes('30')) limite = 30;
        if (preco.includes('60')) limite = 60;

        let visiveis = 0;

        document.querySelectorAll('.card-carro').forEach(carro => {
            const locais = carro.dataset.locais.split(',');
            const okLocal = local.startsWith('Todas') || locais.includes(local);
            const okCategoria = categoria.startsWith('Todas') || carro.dataset.categoria === categoria;
            const okPreco = Number(carro.dataset.preco) <= limite;
            const mostrarCarro = okLocal && okCategoria && okPreco;

            carro.style.display = mostrarCarro ? '' : 'none';
            if (mostrarCarro) visiveis++;
        });

        semResultados.style.display = visiveis === 0 ? 'block' : 'none';
        return visiveis;
    }

    btnFiltrar.addEventListener('click', aplicarFiltros);

    // Pesquisa vinda da página inicial (frota.html?local=...&levantamento=...&devolucao=...)
    const params = new URLSearchParams(window.location.search);
    const local = params.get('local');
    const levantamento = params.get('levantamento');
    const devolucao = params.get('devolucao');

    if (local || levantamento || devolucao) {
        if (local) selLocal.value = local;

        const total = aplicarFiltros();

        let texto = `${total} ${total === 1 ? 'carro disponível' : 'carros disponíveis'}`;
        if (local) texto += ` em ${local}`;
        if (levantamento && devolucao) {
            texto += ` · ${formatarData(levantamento)} → ${formatarData(devolucao)}`;
        }

        resumo.textContent = texto;
        resumo.style.display = 'block';
    }
}