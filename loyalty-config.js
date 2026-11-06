const LOYALTY_CONFIG = {
    isEnabled: true, // true — программа работает, false — выключена
    applyTo: 'ALL', // 'ALL' — для всех, 'NEW_ONLY' — только для новых
    
    levels: [
        { id: 'bronze', name: 'Бронза', visitsRequired: 0, discountPercent: 0, bonusGift: null, icon: '🥉' },
        { id: 'silver', name: 'Серебро', visitsRequired: 3, discountPercent: 5, bonusGift: 'Уход за кутикулой в подарок', icon: '🥈' },
        { id: 'gold', name: 'Золото', visitsRequired: 6, discountPercent: 10, bonusGift: 'Массаж рук', icon: '🥇' },
        { id: 'platinum', name: 'Платина', visitsRequired: 10, discountPercent: 15, bonusGift: 'Услуга до 1000 ₽ бесплатно', icon: '💎' }
    ]
};