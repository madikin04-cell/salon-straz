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
// ==========================================
// ПАНЕЛЬ АДМИНИСТРАТОРА (ЛОЯЛЬНОСТЬ)
// ==========================================

// 1. Загрузка настроек лояльности из базы
async function fetchAdminLoyaltySettings() {
    if (!sbClient) return;
    
    // Получаем статус (вкл/выкл)
    const { data: settings } = await sbClient.from('loyalty_settings').select('*').eq('id', 1).single();
    // Получаем уровни
    const { data: levels } = await sbClient.from('loyalty_levels').select('*').order('required_visits', { ascending: true });
    
    renderAdminLoyaltyUI(settings, levels || []);
}

// 2. Отрисовка полей для редактирования
function renderAdminLoyaltyUI(settings, levels) {
    const container = document.getElementById('adminLoyaltyLevelsContainer');
    const statusBtn = document.getElementById('btnToggleLoyaltyStatus');
    if (!container || !statusBtn) return;

    const isEnabled = settings ? settings.is_enabled : false;
    
    // Обновляем кнопку статуса
    if (isEnabled) {
        statusBtn.innerHTML = '✅ Программа включена';
        statusBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 shadow hover:bg-emerald-200 transition';
    } else {
        statusBtn.innerHTML = '⛔ Программа выключена';
        statusBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-rose-100 text-rose-700 shadow hover:bg-rose-200 transition';
    }
    
    statusBtn.dataset.enabled = isEnabled;

    // Рисуем уровни лояльности
    container.innerHTML = levels.map((lvl, index) => `
        <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5 relative">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-xs font-extrabold text-slate-800">Уровень ${index + 1}</span>
                <input type="hidden" id="loyalty_id_${index}" value="${lvl.id}">
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="text-[10px] font-bold text-slate-500 mb-1 block">Название уровня</label>
                    <input type="text" id="loyalty_name_${index}" value="${lvl.name}" class="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:border-pink-500">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-500 mb-1 block">Нужно визитов</label>
                    <input type="number" id="loyalty_visits_${index}" value="${lvl.required_visits}" class="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:border-pink-500">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="text-[10px] font-bold text-slate-500 mb-1 block">Скидка (%)</label>
                    <input type="number" id="loyalty_discount_${index}" value="${lvl.discount_percent}" class="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:border-pink-500">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-500 mb-1 block">Текст бонуса</label>
                    <input type="text" id="loyalty_bonus_${index}" value="${lvl.bonus_text || ''}" class="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:border-pink-500">
                </div>
            </div>
        </div>
    `).join('');
}

// 3. Включение / Отключение программы
async function toggleLoyaltyStatus() {
    const btn = document.getElementById('btnToggleLoyaltyStatus');
    const currentStatus = btn.dataset.enabled === 'true';
    const newStatus = !currentStatus;
    
    btn.innerHTML = 'Загрузка...';
    await sbClient.from('loyalty_settings').update({ is_enabled: newStatus }).eq('id', 1);
    await fetchAdminLoyaltySettings();
    
    if (typeof showToast === 'function') showToast('Настройки обновлены', newStatus ? 'Программа лояльности включена' : 'Программа лояльности выключена');
}

// 4. Сохранение изменений в уровнях
async function saveLoyaltyLevels() {
    const btn = document.getElementById('btnSaveLoyaltyLevels');
    btn.innerHTML = 'Сохранение...';
    
    for (let i = 0; i < 3; i++) {
        const id = document.getElementById(`loyalty_id_${i}`)?.value;
        const name = document.getElementById(`loyalty_name_${i}`)?.value;
        const visits = parseInt(document.getElementById(`loyalty_visits_${i}`)?.value || 0);
        const discount = parseInt(document.getElementById(`loyalty_discount_${i}`)?.value || 0);
        const bonus = document.getElementById(`loyalty_bonus_${i}`)?.value;
        
        if (id && name) {
            await sbClient.from('loyalty_levels').update({
                name: name, required_visits: visits, discount_percent: discount, bonus_text: bonus
            }).eq('id', id);
        }
    }
    
    await fetchAdminLoyaltySettings();
    btn.innerHTML = 'Сохранить изменения уровней';
    if (typeof showToast === 'function') showToast('Успех', 'Уровни лояльности обновлены');
}

// 5. Логика сворачивания/разворачивания секции
function toggleLoyaltyAdminSection() {
    const wrapper = document.getElementById('adminLoyaltyWrapper');
    const icon = document.getElementById('adminLoyaltyChevron');
    wrapper.classList.toggle('hidden');
    
    if (!wrapper.classList.contains('hidden')) {
        icon.style.transform = 'rotate(180deg)';
        fetchAdminLoyaltySettings(); // Загружаем данные при открытии
    } else {
        icon.style.transform = 'rotate(0deg)';
    }
}