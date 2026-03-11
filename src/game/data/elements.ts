export interface ElementDef {
    symbol: string;
    name: string;
    hp: number;
    cost: number;
    color: number;
    hexColor: string;
    textColor: string;
    description: string;
    special?: 'explode';
}

export const ELEMENTS: Record<string, ElementDef> = {
    C: {
        symbol: 'C',
        name: 'Carbon',
        hp: 20,
        cost: 2,
        color: 0x555555,
        hexColor: '#555555',
        textColor: '#cccccc',
        description: 'Cheap & weak',
    },
    Fe: {
        symbol: 'Fe',
        name: 'Iron',
        hp: 60,
        cost: 5,
        color: 0xa8a8a8,
        hexColor: '#a8a8a8',
        textColor: '#333333',
        description: 'Strong defense',
    },
    Si: {
        symbol: 'Si',
        name: 'Silicon',
        hp: 40,
        cost: 4,
        color: 0x4488cc,
        hexColor: '#4488cc',
        textColor: '#ffffff',
        description: 'Blast resistant',
    },
    U: {
        symbol: 'U',
        name: 'Uranium',
        hp: 30,
        cost: 8,
        color: 0x44cc44,
        hexColor: '#44cc44',
        textColor: '#000000',
        description: 'Explodes on destroy',
        special: 'explode',
    },
};

export const ELEMENT_KEYS = Object.keys(ELEMENTS);

export const STARTING_INVENTORY: Record<string, number> = {
    C: 10,
    Fe: 5,
    Si: 3,
    U: 1,
};
