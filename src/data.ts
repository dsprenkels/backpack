import { line } from './filter';
import { BL } from './types';

const PAKLIJST_DATABASE: BL = [
    {
        header: "Kleding",
        items: [
            { name: "topjes", default: true },
            { name: "lange broeken", default: true },
            { name: "rokjes/korte broeken", tags: ["warm"] },
            { name: "ondergoed", default: true },
            { name: "sokken", default: true },
            { name: "trui", tags: ["koud"] },
            { name: "jas", default: true },
            { name: "wandelschoenen", tags: ["wandelen"] },
            { name: "zwemkleding", tags: ["zwemmen"] },
            { name: "(bad)handdoek", tags: ["zwemmen", "kamperen"] },
            { name: "zak voor vieze was", default: true },
        ],
    },
    {
        header: "Kampeerspullen",
        items: [
            { name: "tent", tags: ["kamperen"] },
            { name: "slaapzak", tags: ["kamperen"] },
            { name: "liner", tags: ["kamperen"] },
            { name: "matje", tags: ["kamperen"] },
            { name: "foldacup", tags: ["kamperen"] },
            { name: "bestek", tags: ["kamperen"] },
            { name: "trangia setje", tags: ["kamperen"] },
            { name: "olie", tags: ["kamperen"] },
            { name: "kruiden", tags: ["kamperen"] },
        ],
    },
    {
        header: "Klimspullen",
        items: [
            { name: "klimschoenen", tags: ["klimmen"] },
            { name: "zekermateriaal", tags: ["klimmen"] },
            { name: "pofzak", tags: ["klimmen"] },
            { name: "topo", tags: ["klimmen"] },
        ]
    },
    {
        header: "Fietsen",
        items: [
            { name: "bandenplakset", tags: ["fietsen"] },
            { name: "EHBO-kitje", tags: ["fietsen"] },
            { name: "pompje", tags: ["fietsen"] },
            { name: "smeerolie", tags: ["fietsen"] },
        ],
    },
    {
        header: "Toiletspullen/medisch",
        items: [
            { name: "tandenborstel", default: true },
            { name: "tandpasta", impliedBy: ["tandenborstel"] },
            { name: "deoderant", default: true },
            { name: "cetrizine", default: true },
            { name: "cypro", default: true },
            { name: "estradiol", default: true },
            { name: "oordopjes (demping)", default: true },
            // { name: "haarband" },
            { name: "haarelastiekjes", default: true },
            { name: "conditioner", default: true },
            { name: "haargel", default: true },
            { name: "tissues", default: true },
            { name: "vaseline", default: true },
            { name: "zonnebrandcrème", tags: ["warm"] },
            { name: "zonnebril", tags: ["warm"] },
            { name: "scheermesje", tags: [">5 dagen"] },
            { name: "scheerschuim", impliedBy: ["scheermes"] },
            { name: "sporttape", tags: ["wandelen", "klimmen"] },
        ],
    },
    {
        header: "Administratie",
        items: [
            { name: "Secrid", default: true },
            { name: "paspoort", tags: ["buitenland"] },
            { name: "reispapieren (verzekering etc.)", default: true },
            { name: "gele boekje", tags: ["buitenland"] },
            { name: "creditcard", tags: ["buitenland"] },
            { name: "vliegtickets", tags: ["vliegreis"] },
            { name: "herstelbewijs", tags: ["buitenland"] },
            { name: "vaccinatiebewijs", tags: ["buitenland"] },
        ]
    },
    {
        header: "Vermaak/werk",
        items: [
            { name: "leesboek/e-reader", default: true },
            { name: "smartphone", default: true },
            { name: "oplader smartphone", impliedBy: ["smartphone"] },
            { name: "iPad", tags: ["werk"] },
            { name: "oplader iPad", impliedBy: ["iPad"] },
            { name: "powerbank", tags: ["werk", ">5 dagen", "wandelen", "kamperen"] },
            { name: "oplader powerbank", impliedBy: ["powerbank"] },
            { name: "laptop", tags: ["werk"] },
            { name: "oplader laptop", impliedBy: ["laptop"] },
            { name: "oplader smartwatch", impliedBy: [">5 dagen"] },
            { name: "koptelefoon/oordopjes", tags: ["vliegreis", "kamperen", "werk", "auto"] },
            { name: "pen/papier", tags: ["werk"] }
        ],
    },
    {
        header: "Eten/drinken",
        items: [
            { name: "eten voor de eerste dag", tags: ["kamperen"] },
            { name: "flesje", default: true },
            { name: "extra flesje voor onderweg", tags: ["wandelen", "fietsen", "klimmen"] },
            { name: "twennybar", default: true },
        ]
    },
]

export default PAKLIJST_DATABASE