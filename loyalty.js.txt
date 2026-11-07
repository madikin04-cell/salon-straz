// loyalty.js - Независимый модуль программы лояльности «СТРАЗЫ»

// 1. Запрос к базе данных для получения статуса клиента
async function fetchClientLoyalty(phone) {
    // Ждем, пока клиент введет хотя бы 10 цифр номера
    if (!sbClient || !phone || phone.replace(/\D/g, '').length < 10) return null;
    
    try {
        const { data, error } = await sbClient.rpc('get_client_loyalty', { p_phone: phone });
        if (error) {
            console.error("Ошибка при проверке лояльности:", error);
            return null;
        }
        return data; // Возвращает JSON с уровнем, скидкой и прогрессом
    } catch (e) {
        console.error("Критическая ошибка лояльности:", e);
        return null;
    }
}

// 2. Математика: Применение скидки к оригинальной цене
function calculateDiscountedPrice(price, discountPercent) {
    if (!discountPercent || discountPercent <= 0) return price;
    const discountAmount = Math.floor(price * (discountPercent / 100));
    return Math.max(0, price - discountAmount);
}

// 3. Обновление интерфейса (UI) в модальном окне записи
async function updateLoyaltyUI() {
    const phoneInput = document.getElementById('clientPhoneInput');
    const container = document.getElementById('loyaltyWidgetContainer');
    
    if (!phoneInput || !container) return;

    const phone = phoneInput.value.trim();
    const loyalty = await fetchClientLoyalty(phone);
    
    // Если клиент новый или программа выключена — прячем виджет и сбрасываем цену
    if (!loyalty || !loyalty.enabled) {
        container.innerHTML = '';
        container.classList.add('hidden');
        applyDiscountToModalPrice(0);
        return;
    }

    // Рендерим виджет лояльности с полосой прогресса
    let html = `
        <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-700">Уровень: <span class="text-pink-600">${loyalty.current_level}</span></span>
            <span class="text-[10px] font-extrabold bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full shadow-sm">Скидка ${loyalty.discount}%</span>
        </div>
    `;

    if (loyalty.next_level) {
        const progressPercent = (loyalty.total_visits / (loyalty.total_visits + loyalty.visits_to_next)) * 100;
        html += `
            <div class="text-[10px] text-slate-500 mb-1.5 flex justify-between">
                <span>Визитов: ${loyalty.total_visits}</span>
                <span>Осталось ${loyalty.visits_to_next} до «${loyalty.next_level}»</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden shadow-inner">
                <div class="bg-gradient-to-r from-pink-400 to-pink-600 h-1.5 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
            </div>
            <div class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md inline-block">
                🎁 Следующий бонус: ${loyalty.next_bonus}
            </div>
        `;
    } else {
        html += `<div class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md mt-1">
            🎁 Максимальный уровень! ${loyalty.current_bonus}
        </div>`;
    }

    container.innerHTML = html;
    container.classList.remove('hidden');

    // Пересчитываем итоговую цену со скидкой
    applyDiscountToModalPrice(loyalty.discount);
}

// 4. Перерисовка цены в окне с учетом скидки
function applyDiscountToModalPrice(discountPercent) {
    if (!selectedMasterId || !selectedServiceTitle) return;
    
    const master = mastersData.find(m => m.id === selectedMasterId);
    if (!master) return;
    
    const safeTitle = selectedServiceTitle.toLowerCase();
    const selSvc = (master.services || []).find(s => (s.title || '').toLowerCase() === safeTitle);
    
    if (selSvc) {
        const originalPrice = selSvc.price;
        const finalPrice = calculateDiscountedPrice(originalPrice, discountPercent);
        const priceEl = document.getElementById('modalTotalPrice');
        
        if (discountPercent > 0) {
            priceEl.innerHTML = `<span class="line-through text-slate-400 text-sm font-medium mr-2">${originalPrice} ₽</span><span class="text-pink-600">${finalPrice} ₽</span>`;
        } else {
            priceEl.textContent = `${originalPrice} ₽`;
        }
    }
}