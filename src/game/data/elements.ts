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

type ElementCategory = 'metal' | 'nonmetal' | 'noble';

const CATEGORY_STYLE: Record<ElementCategory, { color: number; hexColor: string; textColor: string; hp: number; cost: number; description: string }> = {
    metal: {
        color: 0xd8a2c3,
        hexColor: '#d8a2c3',
        textColor: '#2b2330',
        hp: 48,
        cost: 4,
        description: 'Stable metal block',
    },
    nonmetal: {
        color: 0xe6d83f,
        hexColor: '#e6d83f',
        textColor: '#2d2a14',
        hp: 34,
        cost: 3,
        description: 'Reactive nonmetal block',
    },
    noble: {
        color: 0x89d7cf,
        hexColor: '#89d7cf',
        textColor: '#173836',
        hp: 40,
        cost: 5,
        description: 'Inert noble gas block',
    },
};

function makeElement(symbol: string, name: string, category: ElementCategory, overrides?: Partial<ElementDef>): ElementDef {
    const base = CATEGORY_STYLE[category];
    return {
        symbol,
        name,
        hp: base.hp,
        cost: base.cost,
        color: base.color,
        hexColor: base.hexColor,
        textColor: base.textColor,
        description: base.description,
        ...overrides,
    };
}

export const ELEMENTS: Record<string, ElementDef> = {
    // Row 4
    K: makeElement('K', 'Potassium', 'metal', { hp: 38, cost: 3 }),
    Ca: makeElement('Ca', 'Calcium', 'metal', { hp: 44, cost: 3 }),
    Sc: makeElement('Sc', 'Scandium', 'metal'),
    Ti: makeElement('Ti', 'Titanium', 'metal', { hp: 58, cost: 5 }),
    V: makeElement('V', 'Vanadium', 'metal', { hp: 52, cost: 4 }),
    Cr: makeElement('Cr', 'Chromium', 'metal', { hp: 55, cost: 4 }),
    Mn: makeElement('Mn', 'Manganese', 'metal', { hp: 46, cost: 4 }),
    Fe: makeElement('Fe', 'Iron', 'metal', { hp: 60, cost: 5, color: 0xa8a8a8, hexColor: '#a8a8a8', textColor: '#333333', description: 'Strong defense' }),
    Co: makeElement('Co', 'Cobalt', 'metal', { hp: 53, cost: 5 }),
    Ni: makeElement('Ni', 'Nickel', 'metal', { hp: 52, cost: 4 }),
    Cu: makeElement('Cu', 'Copper', 'metal', { hp: 46, cost: 4 }),
    Zn: makeElement('Zn', 'Zinc', 'metal', { hp: 42, cost: 4 }),
    Ga: makeElement('Ga', 'Gallium', 'metal', { hp: 40, cost: 3 }),
    Ge: makeElement('Ge', 'Germanium', 'metal', { hp: 43, cost: 4 }),
    As: makeElement('As', 'Arsenic', 'nonmetal', { hp: 37, cost: 4 }),
    Se: makeElement('Se', 'Selenium', 'nonmetal', { hp: 36, cost: 4 }),
    Br: makeElement('Br', 'Bromine', 'nonmetal', { hp: 35, cost: 4 }),
    Kr: makeElement('Kr', 'Krypton', 'noble', { hp: 42, cost: 5 }),

    // Row 5
    Rb: makeElement('Rb', 'Rubidium', 'metal', { hp: 37, cost: 3 }),
    Sr: makeElement('Sr', 'Strontium', 'metal', { hp: 44, cost: 3 }),
    Y: makeElement('Y', 'Yttrium', 'metal', { hp: 47, cost: 4 }),
    Zr: makeElement('Zr', 'Zirconium', 'metal', { hp: 55, cost: 5 }),
    Nb: makeElement('Nb', 'Niobium', 'metal', { hp: 54, cost: 5 }),
    Mo: makeElement('Mo', 'Molybdenum', 'metal', { hp: 56, cost: 5 }),
    Tc: makeElement('Tc', 'Technetium', 'metal', { hp: 49, cost: 4 }),
    Ru: makeElement('Ru', 'Ruthenium', 'metal', { hp: 52, cost: 5 }),
    Rh: makeElement('Rh', 'Rhodium', 'metal', { hp: 53, cost: 5 }),
    Pd: makeElement('Pd', 'Palladium', 'metal', { hp: 52, cost: 5 }),
    Ag: makeElement('Ag', 'Silver', 'metal', { hp: 46, cost: 4 }),
    Cd: makeElement('Cd', 'Cadmium', 'metal', { hp: 44, cost: 4 }),
    In: makeElement('In', 'Indium', 'metal', { hp: 42, cost: 4 }),
    Sn: makeElement('Sn', 'Tin', 'metal', { hp: 45, cost: 4 }),
    Sb: makeElement('Sb', 'Antimony', 'nonmetal', { hp: 40, cost: 4 }),
    Te: makeElement('Te', 'Tellurium', 'nonmetal', { hp: 38, cost: 4 }),
    I: makeElement('I', 'Iodine', 'nonmetal', { hp: 36, cost: 4 }),
    Xe: makeElement('Xe', 'Xenon', 'noble', { hp: 43, cost: 5 }),

    // Row 7
    Fr: makeElement('Fr', 'Francium', 'metal', { hp: 36, cost: 3 }),
    Ra: makeElement('Ra', 'Radium', 'metal', { hp: 45, cost: 4 }),
    Rf: makeElement('Rf', 'Rutherfordium', 'metal', { hp: 58, cost: 6 }),
    Db: makeElement('Db', 'Dubnium', 'metal', { hp: 57, cost: 6 }),
    Sg: makeElement('Sg', 'Seaborgium', 'metal', { hp: 58, cost: 6 }),
    Bh: makeElement('Bh', 'Bohrium', 'metal', { hp: 58, cost: 6 }),
    Hs: makeElement('Hs', 'Hassium', 'metal', { hp: 59, cost: 6 }),
    Mt: makeElement('Mt', 'Meitnerium', 'metal', { hp: 59, cost: 6 }),
    Ds: makeElement('Ds', 'Darmstadtium', 'metal', { hp: 59, cost: 6 }),
    Rg: makeElement('Rg', 'Roentgenium', 'metal', { hp: 58, cost: 6 }),
    Cn: makeElement('Cn', 'Copernicium', 'metal', { hp: 56, cost: 6 }),
    Nh: makeElement('Nh', 'Nihonium', 'metal', { hp: 52, cost: 6 }),
    Fl: makeElement('Fl', 'Flerovium', 'metal', { hp: 52, cost: 6 }),
    Mc: makeElement('Mc', 'Moscovium', 'metal', { hp: 52, cost: 6 }),
    Lv: makeElement('Lv', 'Livermorium', 'metal', { hp: 52, cost: 6 }),
};

export const ELEMENT_KEYS = Object.keys(ELEMENTS);

export const STARTING_INVENTORY: Record<string, number> = {
    Fe: 5,
    Cu: 4,
    Zn: 4,
    K: 4,
    Br: 4,
    Kr: 3,
    Ag: 3,
    Xe: 3,
    Fr: 2,
    Ra: 2,
    Rf: 2,
};
