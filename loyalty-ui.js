const LoyaltyUI = {
    renderClientBanner(visits) {
        const container = document.getElementById('loyaltyBannerContainer');
        if (!container || !LOYALTY_CONFIG.isEnabled) return;

        const level = LoyaltyEngine.getLevelByVisits(visits);
        const progress = LoyaltyEngine.getProgress(visits);

        container.innerHTML = `
            <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mt-3">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${level.icon}</span>
                        <div>
                            <div class="text-[10px] font-bold text-slate-400 uppercase">Ваш статус</div>
                            <div class="text-sm font-extrabold text-slate-900">${level.name}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] font-bold text-slate-400 uppercase">Скидка</div>
                        <div class="text-sm font-extrabold text-emerald-600">${level.discountPercent}%</div>
                    </div>
                </div>

                <div class="w-full bg-slate-100 rounded-full h-2.5 mb-1.5 overflow-hidden">
                    <div class="bg-pink-500 h-2.5 rounded-full" style="width: ${progress.percent}%"></div>
                </div>
                
                <div class="flex justify-between items-center text-[11px]">
                    <span class="text-slate-500 font-medium">Посещений: <strong>${visits}</strong></span>
                    <span class="text-purple-700 font-bold">${progress.text}</span>
                </div>

                ${level.bonusGift ? `
                <div class="mt-3 bg-pink-50 rounded-lg p-2 flex items-start gap-2 border border-pink-100">
                    <span class="text-pink-600 text-sm">🎁</span>
                    <div class="text-[11px] text-pink-900 font-medium leading-tight">${level.bonusGift}</div>
                </div>` : ''}
            </div>
        `;
    }
};