(() => {
    'use strict';

    // Devolve a data de hoje no fuso horário local, sem conversões UTC.
    function getTodayISO() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDate(isoDate) {
        const [year, month, day] = isoDate.split('-').map(Number);
        return new Intl.DateTimeFormat('pt-PT').format(
            new Date(year, month - 1, day)
        );
    }

    function initSearchForm() {
        const form = document.querySelector('#form-pesquisa-carros');
        if (!form) return;

        const pickupInput = form.querySelector('#data-levantamento');
        const returnInput = form.querySelector('#data-devolucao');
        if (!pickupInput || !returnInput) return;

        const today = getTodayISO();
        pickupInput.min = today;
        returnInput.min = today;

        function updateReturnMinimum() {
            const minimumReturnDate = pickupInput.value || today;
            returnInput.min = minimumReturnDate;

            // A devolução tem de ser posterior ao levantamento.
            if (returnInput.value && returnInput.value <= minimumReturnDate) {
                returnInput.value = '';
            }
            returnInput.setCustomValidity('');
        }

        pickupInput.addEventListener('change', updateReturnMinimum);
        returnInput.addEventListener('change', () => {
            returnInput.setCustomValidity('');
        });

        form.addEventListener('submit', (event) => {
            const currentToday = getTodayISO();
            pickupInput.min = currentToday;

            if (!pickupInput.value || pickupInput.value < currentToday) {
                event.preventDefault();
                pickupInput.setCustomValidity('A data de levantamento não pode ser anterior a hoje.');
                pickupInput.reportValidity();
                return;
            }

            if (!returnInput.value || returnInput.value <= pickupInput.value) {
                event.preventDefault();
                returnInput.setCustomValidity('A data de devolução tem de ser posterior à data de levantamento.');
                returnInput.reportValidity();
                return;
            }

            pickupInput.setCustomValidity('');
            returnInput.setCustomValidity('');
        });
    }

    function parseReservations(card) {
        const rawReservations = card.dataset.reservas;
        if (!rawReservations) return [];

        try {
            const reservations = JSON.parse(rawReservations);
            return Array.isArray(reservations) ? reservations : [];
        } catch (error) {
            console.error('Formato inválido em data-reservas num cartão de carro:', error);
            // Em caso de dados de reservas mal formatados, não disponibilizamos
            // o carro por segurança, para evitar mostrar uma disponibilidade falsa.
            return [{ inicio: '0000-01-01', fim: '9999-12-31' }];
        }
    }

    function hasReservationConflict(card, pickupDate, returnDate) {
        return parseReservations(card).some((reservation) => {
            if (!reservation.inicio || !reservation.fim) return true;

            // Os intervalos são tratados como [levantamento, devolução).
            // Assim, uma nova reserva pode começar no dia em que termina a anterior.
            return pickupDate < reservation.fim && returnDate > reservation.inicio;
        });
    }

    function filterFleetFromSearch() {
        const params = new URLSearchParams(window.location.search);
        const location = params.get('local');
        const pickupDate = params.get('levantamento');
        const returnDate = params.get('devolucao');

        const cards = Array.from(document.querySelectorAll('[data-carro]'));
        const summary = document.querySelector('#resultado-pesquisa-resumo');
        const emptyState = document.querySelector('#sem-resultados-pesquisa');
        const hasCompleteSearch = Boolean(location && pickupDate && returnDate);

        if (!hasCompleteSearch) return;

        // Evita aceitar parâmetros incompletos ou datas incoerentes no URL.
        const today = getTodayISO();
        const validDates = /^\d{4}-\d{2}-\d{2}$/.test(pickupDate)
            && /^\d{4}-\d{2}-\d{2}$/.test(returnDate)
            && pickupDate >= today
            && returnDate > pickupDate;

        if (!validDates) {
            if (summary) summary.textContent = 'Pesquisa inválida. Escolhe datas válidas e tenta novamente.';
            if (emptyState) {
                emptyState.hidden = false;
                emptyState.textContent = 'A data de levantamento tem de ser hoje ou posterior e a devolução tem de ser depois do levantamento.';
            }
            cards.forEach((card) => { card.hidden = true; });
            return;
        }

        const locationNames = {
            'lisboa-aeroporto': 'Lisboa-Aeroporto',
            'porto-aeroporto': 'Porto-Aeroporto',
            'coimbra-estacao': 'Coimbra-Estação'
        };
        const locationName = locationNames[location] || location;

        let availableCount = 0;

        cards.forEach((card) => {
            const cardLocations = (card.dataset.locais || '')
                .split(',')
                .map((item) => item.trim().toLowerCase())
                .filter(Boolean);

            const servesLocation = cardLocations.includes(location.toLowerCase());
            const hasNoBookingConflict = !hasReservationConflict(card, pickupDate, returnDate);
            const isAvailable = servesLocation && hasNoBookingConflict;

            card.hidden = !isAvailable;
            if (isAvailable) availableCount += 1;
        });

        if (summary) {
            const carWord = availableCount === 1 ? 'carro disponível' : 'carros disponíveis';
            summary.textContent = `${availableCount} ${carWord} em ${locationName}, de ${formatDate(pickupDate)} a ${formatDate(returnDate)}.`;
        }

        if (emptyState) {
            emptyState.hidden = availableCount !== 0;
            if (availableCount === 0) {
                emptyState.textContent = 'Não existem carros disponíveis para este local e período. Experimenta outras datas ou outro local de levantamento.';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initSearchForm();
        filterFleetFromSearch();
    });
})();
