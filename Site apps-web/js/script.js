// ===== Menu móvel (todas as páginas) =====
const btn = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');

if (btn && menu) {
    btn.addEventListener('click', () => {
        const aberto = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', aberto);
    });
}

// ===== Mostrar / ocultar palavra-passe (só entrar.html) =====
const password = document.getElementById('password');
const mostrar = document.getElementById('mostrar-password');

if (password && mostrar) {
    mostrar.addEventListener('click', () => {
        const visivel = password.type === 'text';
        password.type = visivel ? 'password' : 'text';
        mostrar.textContent = visivel ? 'Mostrar' : 'Ocultar';
    });
}