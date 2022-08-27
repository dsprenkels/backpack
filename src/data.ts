import { BringList, parseDatabase } from "./filterspec"

export const BRINGLIST_DATABASE_SRC: string =
`
// Kleding tot 10 dagen
# Kleding [ <10 ]

topje [ *2 !(warm & !lichtgewicht) ]
topje [ *1 (warm & !lichtgewicht) ]
lange broek [ *5 !warm ]
1x lange broek [ warm ]
rokjes/korte broeken [ *2.5 warm ]
boxer [ *1 ]
beha [ *7 ]
sokken [ *1 ]
trui [ !warm ]
(regen)jas
wandelschoenen [ wandelen ]
zwemkleding [ zwemmen ]
slippers [ (warm | zwemmen) & !lichtgewicht ]
pyjama/nachthemd
(bad)handdoek [ zwemmen | kamperen ]
zak voor vieze was

// Kleding vanaf 10 dagen
# Kleding [ >=10 ]

5x topje [ !(warm & !lichtgewicht) ]
10x topje [ (warm & !lichtgewicht) ]
2x lange broek [ !warm ]
1x lange broek [ warm ]
4x rokjes/korte broeken [ warm ]
10x boxer
2x beha
10x sokken
trui [ !warm ]
jas
wandelschoenen [ wandelen ]
zwemkleding [ zwemmen ]
slippers [ (warm | zwemmen) & !lichtgewicht ]
pyjama/nachthemd
(bad)handdoek [ zwemmen | kamperen ]
zak voor vieze was
// Na 10 dagen moeten we maar gewoon kleding gaan wassen
wasmiddel

# Kampeerspullen [ kamperen ]
tent
slaapzak
liner
matje
foldacups
mesje
spork
kooksetje
bakje
spateltje
olie voor koken
kruiden
campingstoeltje [ fietsen | auto ]
spelletjes [ !lichtgewicht ]

# Klimspullen [ klimmen ]
klimschoenen
zekermateriaal
pofzak
topo

# Fietsen [ fietsen ]
bandenplakset
inbussleuteltje
spin
EHBO-kitje
pompje
smeerolie

# Toiletspullen
tandenborstel
tandpasta
deodorant
cetrizine
estradiol
paracetamol [ !lichtgewicht ]
ibuprofen [ !lichtgewicht ]
sieraden
haarelastiekjes
oordopjes (voor slapen)
conditioner [ !lichtgewicht ]
haargel [ !lichtgewicht ]
tissues
vaseline
zonnebrandcrème [ warm ]
zonnebril [ warm ]
muggenspul [ warm ]
nagelvijl [ >=3 ]
scheermesje [ >=3 ]
scheerschuim [ >=3 ]
sporttape [ wandelen | klimmen ]
mondmaskers [ !lichtgewicht | buitenland ]
zelftesten [ !lichtgewicht ]

# Administratie
Secrid
paspoort [ buitenland ]
reispapieren (verzekering etc.)
medisch paspoort [ buitenland ]
gele boekje [ buitenland ]
creditcard [ buitenland ]
vliegtickets [ vliegreis ]
vaccinatiebewijs [ buitenland ]
herstelbewijs [ buitenland ]

# Vermaak/werk
leesboek/e-reader
smartphone
oplader smartphone
iPad [ !lichtgewicht | ipad ]
oplader iPad [ !lichtgewicht | ipad ]
laptop [ !lichtgewicht | werk | laptop ]
oplader laptop [ !lichtgewicht | werk | laptop ]
powerbank [ werk | >=5 | wandelen | kamperen | fietsen ]
oplader powerbank [ werk | >=5 | wandelen | kamperen | fietsen ]
oplader smartwatch [ >=5 ]
knuffel [ !lichtgewicht & !werk ]
koptelefoon/oordopjes [ vliegreis | kamperen | werk | fietsen ]
oordopjes (concert, voor onder koptelefoon) [ vliegreis ]
pen/papier [ werk | fietsen | kamperen ]
vlaggetje voor achter op de fiets [ fietsen & kamperen ]

# Eten/drinken
eten voor de eerste dag [ kamperen ]
snack voor tijdens inspanning [ fietsen | wandelen ]
flesje
extra flesje voor onderweg [ wandelen | fietsen | klimmen ]
twennybar [ *1 <=3 & (vliegreis | kamperen | fietsen) ]
3x twennybar [ >3 & (vliegreis | kamperen | fietsen) ]
1x twennybar [ !(vliegreis | kamperen | fietsen) ]
`.trim()

const BRINGLIST_DATABASE: BringList = parseDatabase(BRINGLIST_DATABASE_SRC)

export default BRINGLIST_DATABASE