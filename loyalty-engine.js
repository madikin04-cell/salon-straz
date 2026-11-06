const LoyaltyEngine = {
    getLevelByVisits(visits) {
        let currentLevel = LOYALTY_CONFIG.levels[0];
        for (const level of LOYALTY_CONFIG.levels) {
            if (visits >= level.visitsRequired) currentLevel = level;
        }
        return currentLevel;
    },
    
    getProgress(visits) {
        const currentLevel = this.getLevelByVisits(visits);
        const currentIndex = LOYALTY_CONFIG.levels.findIndex(l => l.id === currentLevel.id);
        const nextLevel = LOYALTY_CONFIG.levels[currentIndex + 1];

        if (!nextLevel) return { percent: 100, text: 'Максимальный уровень!' };

        const totalNeeded = nextLevel.visitsRequired - currentLevel.visitsRequired;
        const currentProgress = visits - currentLevel.visitsRequired;
        const percent = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));
        const remaining = nextLevel.visitsRequired - visits;

        return { percent: percent, text: `До ${nextLevel.name} осталось ${remaining} посещ.` };
    }
};