import { BringList, parseDatabase } from "./filterspec"

const BRINGLIST_DATABASE: BringList = parseDatabase(
`
# Kleding []
topjes [ *2 !warm ]
topjes [ *1 warm ]
lange broeken [ *4 !warm ]
lange broek [ warm ]
rokjes/korte broeken [ *2.5 warm ]
ondergoed [ *1 ]
sokken (tenzij slippers) [ *1 ]
trui [ !warm ]
jas
wandelschoenen [ wandelen ]
zwemkleding [ zwemmen ]
slippers [ warm | zwemmen ]
pyjama
(bad)handdoek [ zwemmen | kamperen ]
zak voor vieze was

# Kampeerspullen [kamperen]
tent [ kamperen ]
slaapzak [ kamperen ]
liner [ kamperen ]
matje [ kamperen ]
foldacups [ kamperen ]
bestek [ kamperen ]
bestek [ kamperen ]
kooksetje [ kamperen ]
bakje [ kamperen ]
spateltje [ kamperen ]
olie voor koken [ kamperen ]
kruiden [ kamperen ]
campingstoeltje [ (kamperen & fietsen) | (kamperen & auto) ]

# Klimspullen
klimschoenen [ klimmen ]
zekermateriaal [ klimmen ]
pofzak [ klimmen ]
topo [ klimmen ]

# Fietsen
bandenplakset [ fietsen ]
EHBO-kitje [ fietsen ]
pompje [ fietsen ]
smeerolie [ fietsen ]

# Toiletspullen/medisch
tandenborstel
tandpasta
deodorant
cetrizine
estradiol
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
zelftests

# Administratie
Secrid
paspoort [ buitenland ]
reispapieren (verzekering etc.)
gele boekje [ buitenland ]
creditcard [ buitenland ]
vliegtickets [ vliegreis ]
vaccinatiebewijs [ buitenland ]
herstelbewijs [ buitenland ]

# Vermaak/werk
leesboek/e-reader
smartphone
oplader smartphone
iPad [ !fietsen ]
oplader iPad [ !fietsen ] 
laptop [ werk ]
oplader laptop [ werk ]
powerbank [ werk | >=7 | wandelen | kamperen | fietsen ]
oplader powerbank [ werk | >=7 | wandelen | kamperen | fietsen ]
oplader smartwatch [ >=5 ]
koptelefoon/oordopjes [ vliegreis | kamperen | werk | fietsen ]
oordopjes (concert, voor onder koptelefoon) [ vliegreis ]
spelletjes [ kamperen ]
pen/papier [ werk ]

# Eten/drinken
eten voor de eerste dag [ kamperen ]
flesje
extra flesje voor onderweg [ wandelen | fietsen | klimmen ]
3x twennybar [ vliegreis | kamperen | fietsen ]
1x twennybar [ !(vliegreis | kamperen | fietsen) ]
`.trim())

export default BRINGLIST_DATABASE