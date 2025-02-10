// activities.ts
export interface BreakActivity {
    name: string;
    action: string;
    url?: string;
}

export class BreakActivitiesManager {
    private activities: BreakActivity[] = [
        { 
            name: "Drink water", 
            action: "Grab a glass of water to stay hydrated!" 
        },
        { 
            name: "Quick stretch", 
            action: "Stand up and do some basic stretches" 
        },
        { 
            name: "Meditate", 
            action: "Take a moment to clear your mind", 
            url: "https://algodetox.com/meditate" 
        },
        { 
            name: "Have a snack", 
            action: "Grab a healthy snack to keep your energy up" 
        },
        { 
            name: "Deep breathing", 
            action: "Take 5 deep breaths to refresh your mind" 
        }
    ];

    constructor(customActivities?: BreakActivity[]) {
        if (customActivities) {
            this.activities = customActivities;
        }
    }

    public fetchRandomActivity(): BreakActivity {
        const randomIndex = Math.floor(Math.random() * this.activities.length);
        return this.activities[randomIndex];
    }
}
