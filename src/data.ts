import { BringList, parseDatabase } from "./filterspec"

const BRINGLIST_DATABASE: BringList = parseDatabase(
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

# Klimspullen [ klimmen ]
klimschoenen
zekermateriaal
pofzak
topo

# Fietsen [ fietsen ]
bandenplakset
inbussleuteltje
EHBO-kitje
pompje
smeerolie

# Toiletspullen/medisch
tandenborstel
tandpasta
deodorant
cetrizine
estradiol
paracetamol [ !lichtgewicht ]
oordopjes (voor slapen)
haarelastiekjes
conditioner
haargel
tissues
vaseline
zonnebrandcrèmer [ warm ]
zonnebril [ warm ]
scheermesje [ >=5 ]
scheerschuim [ >=5 ]
sporttape [ wandelen | klimmen ]
mondmaskers [ buitenland ]
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
iPad [ !lichtgewicht ]
oplader iPad [ !lichtgewicht ] 
laptop [ werk ]
oplader laptop [ werk ]
powerbank [ werk | >=7 | wandelen | kamperen | fietsen ]
oplader powerbank [ werk | >=7 | wandelen | kamperen | fietsen ]
oplader smartwatch [ >=5 ]
koptelefoon/oordopjes [ vliegreis | kamperen | werk | fietsen ]
oordopjes (concert, voor onder koptelefoon) [ vliegreis ]
spelletjes [ kamperen ]
pen/papier [ werk | fietsen | kamperen ]
vlaggetje voor achter op de fiets [ fietsen & kamperen ]

# Eten/drinken
eten voor de eerste dag [ kamperen ]
flesje
extra flesje voor onderweg [ wandelen | fietsen | klimmen ]
3x twennybar [ vliegreis | kamperen | fietsen ]
1x twennybar [ !(vliegreis | kamperen | fietsen) ]
`.trim())

export default BRINGLIST_DATABASE