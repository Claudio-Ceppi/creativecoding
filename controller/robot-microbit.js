// =====================================================================
//  KEYESTUDIO MICRO:BIT SMART ROBOT CAR (KS4036)
//  Programma per il telecomando "Robot Controller" (index.html)
//  Serve solo l'estensione "bluetooth" + Impostazioni progetto -> "No Pairing Required".
//
//  >>> Lettera del giocatore: "A" sul primo robot, "B" sul secondo, e così via <<<
// =====================================================================
const GIOCATORE = "A"

const ROBOT = 0x30

let connesso = false
let ultimoComando = 0
let inMovimento = false
let ultimoSx = 0
let ultimoDx = 0

// fari
let colR = 255
let colG = 255
let colB = 255
let lum = 100            // luminosità fari (%)
let frecciaAttiva = false
let effetto = 0
// 0 fisso, 1 respiro, 2 lampeggia, 3 battito, 4 ping pong, 5 frecce,
// 6 arcobaleno, 7 disco, 8 polizia, 9 semaforo, 10 candela, 11 strobo

// display 5x5
let modoDisplay = 0      // 0 lettera, 1 disegno, 4 animazione
let disegno = 0
let animazione = 0

function scrivi(registro: number, valore: number) {
    let buf = pins.createBuffer(2)
    buf[0] = registro
    buf[1] = valore
    pins.i2cWriteBuffer(ROBOT, buf)
}

// =================== FARI ===================
function faroDestro(r: number, g: number, b: number) {
    r = Math.idiv(r * lum, 100)
    g = Math.idiv(g * lum, 100)
    b = Math.idiv(b * lum, 100)
    scrivi(0x08, 255 - r)
    scrivi(0x07, 255 - g)
    scrivi(0x06, 255 - b)
}
function faroSinistro(r: number, g: number, b: number) {
    r = Math.idiv(r * lum, 100)
    g = Math.idiv(g * lum, 100)
    b = Math.idiv(b * lum, 100)
    scrivi(0x09, 255 - r)
    scrivi(0x0a, 255 - g)
    scrivi(0x05, 255 - b)
}
function fari(r: number, g: number, b: number) {
    faroDestro(r, g, b)
    faroSinistro(r, g, b)
}
function fariScala(k: number) {          // colore scelto con luminosità k (0-100)
    fari(Math.idiv(colR * k, 100), Math.idiv(colG * k, 100), Math.idiv(colB * k, 100))
}

// =================== MOTORI (v da -100 a 100) ===================
function motoreA(v: number) {
    let s = Math.round(Math.abs(v) * 255 / 100)
    if (v >= 0) {
        scrivi(0x02, s)
        scrivi(0x01, 0)
    } else {
        scrivi(0x01, s)
        scrivi(0x02, 0)
    }
}
function motoreB(v: number) {
    let s = Math.round(Math.abs(v) * 255 / 100)
    if (v >= 0) {
        scrivi(0x03, s)
        scrivi(0x04, 0)
    } else {
        scrivi(0x04, s)
        scrivi(0x03, 0)
    }
}
function impostaMotori(sinistro: number, destro: number) {
    motoreA(sinistro)
    motoreB(destro)
}

// =================== DISPLAY 5x5 ===================
// un disegno è un numero con 25 "bit", uno per lucina (riga per riga)
function disegnaMaschera(m: number) {
    basic.clearScreen()
    for (let i = 0; i < 25; i++) {
        if ((m >> i) & 1) {
            led.plot(i % 5, Math.idiv(i, 5))
        }
    }
}
function mostraDisplay() {
    if (modoDisplay == 0) {
        basic.showString(GIOCATORE)
    } else if (modoDisplay == 1) {
        disegnaMaschera(disegno)
    }
}

// animazioni (generate insieme alle anteprime della pagina, così sono identiche): 48 in tutto,
// nello stesso ordine della scheda Display del telecomando (1 = Fuochi ... 48 = Mare)
let animFrames = [4096,  469440,  33080895,  0,  4685802,  145728,  33518352,  33553288,  33553860,  33537250,  33004641,  33262624,  33408000,  33481216,  1,  3,  7,  15,  31,  543,  16927,  541215,  17318431,  25707039,  29901343,  31998495,  33047071,  33079839,  33080863,  33080895,  33080959,  33081087,  33081343,  33089535,  33351679,  33482751,  33548287,  33550335,  33554431,  33554430,  33554428,  33554424,  33554416,  33554400,  33553888,  33537504,  33013216,  16236000,  7847392,  3653088,  1555936,  507360,  474592,  473568,  473536,  473472,  473344,  473088,  464896,  202752,  71680,  6144,  4096,  0,  21563657,  18948385,  2368548,  8684692,  9474706,  1200706,  4868168,  15237440,  15237472,  10638788,  10621397,  1024,  64,  4,  256,  16384,  262144,  4194304,  65536,  4329604,  1118480,  31744,  17043521,  11184810,  22369621,  33825,  1059,  39,  15,  30,  540,  16920,  541200,  17318400,  25706496,  29884416,  31457280,  15728640,  7372800,  3179520,  1082400,  1049736,  262673,  1048632,  3670048,  1050896,  1065984,  548,  16793600,  15703918,  15728494,  6590735,  15767815,  14815428,  15237440,  33012040,  33535140,  33549634,  33545889,  33536328,  32979076,  1024,  35872,  1121345,  2243714,  4488452,  8944136,  16805904,  24576,  16384,  0,  4096,  469440,  22037525,  0,  0,  4096,  145728,  4685802,  4685802,  0,  10240,  43040,  109664,  240864,  473536,  930688,  811776,  541184,  0,  1,  32,  1024,  32768,  1048576,  1048592,  1049088,  1064960,  1572864,  17825792,  17825796,  17825920,  17829888,  17956864,  22020096,  22020098,  22020160,  22022144,  22085632,  24117248,  24117256,  24117504,  24125440,  24379392,  32505856,  32505856,  0,  4,  4,  128,  4096,  4194304,  4096,  128,  4,  7440,  16780424,  8406084,  4218914,  2633729,  1333248,  158720,  95232,  63488,  31744,  31744,  15872,  4100,  4104,  4112,  4608,  20480,  528384,  16781312,  8392704,  4198400,  2101248,  1052672,  36864,  5120,  4128,  4097,  4098,  0,  32505856,  33521664,  33553408,  33554400,  33554431,  266304,  135296,  69888,  14336,  266304,  135296,  69888,  14336,  18175428,  19222981,  18175428,  9770452,  4720897,  16850976,  2360324,  8421520,  1053186,  147528,  0,  541184,  17047824,  25301144,  29427804,  14713902,  7340039,  19922963,  26755609,  29630748,  14815374,  24726087,  11855155,  5402777,  19495500,  9747750,  4873859,  19213649,  26383544,  13191756,  6595878,  3281027,  1116225,  33824,  0,  28512,  9504,  28512,  19008,  33554431,  0,  33554431,  0,  0,  0,  33080895,  469440,  4096,  0,  4507785,  19015236,  10031410,  32970880,  32977152,  33011844,  32970816,  33009792,  4194304,  4325376,  4329472,  4329600,  4329792,  4335616,  4751360,  17825792,  1092,  67716,  135300,  270468,  16644,  270468,  135300,  67716,  0,  17318416,  25452824,  29520028,  31537246,  15768623,  7360023,  3679499,  18092165,  9046082,  4539953,  2269448,  1135252,  567626,  17044645,  9046082,  4539953,  2269448,  17895572,  25741914,  29631805,  14815374,  7424599,  3712299,  18092165,  9046082,  4539953,  2269448,  18436740,  8710482,  4355257,  19495500,  9747750,  4332675,  2165825,  1082400,  0,  5251988,  7504156,  2331656,  72864,  20973797,  30015559,  9326594,  291456,  8473237,  2708133,  19551397,  21664936,  22189320,  5415170,  5513298,  8653396,  4329604,  14825614,  32668831,  14825614,  4096,  141440,  4539716,  141440,  25432131,  4357252,  3215640,  18157905,  0,  1048576,  3211264,  7540736,  16199936,  33518352,  15237440,  18284864,  0,  1024,  5120,  21504,  0,  0,  6716620,  0,  6716620,  6716620,  6716620,  0,  0,  0,  4096,  17825809,  17843217,  16777217,  17829905,  16781313,  17843217,  4096,  17825809,  459072,  15139136,  15022944,  459616,  32968704,  32737280,  32605184,  32538624,  32505856,  33030144,  33308672,  33431552]
let animStart = [0, 0, 4, 6, 14, 64, 71, 73, 75, 83, 87, 89, 105, 113, 115, 119, 125, 135, 140, 145, 154, 181, 189, 201, 217, 223, 231, 235, 241, 266, 270, 276, 280, 283, 288, 296, 304, 341, 349, 357, 361, 365, 369, 375, 377, 381, 391, 400, 404]
let animCount = [0, 4, 2, 8, 50, 7, 2, 2, 8, 4, 2, 16, 8, 2, 4, 6, 10, 5, 5, 9, 27, 8, 12, 16, 6, 8, 4, 6, 25, 4, 6, 4, 3, 5, 8, 8, 37, 8, 8, 4, 4, 4, 6, 2, 4, 10, 9, 4, 8]
let animMs = [0, 150, 350, 120, 50, 110, 500, 300, 110, 130, 350, 90, 180, 220, 600, 140, 90, 120, 250, 160, 90, 110, 90, 120, 200, 90, 250, 220, 110, 350, 120, 140, 120, 120, 110, 130, 100, 140, 90, 150, 140, 120, 180, 500, 250, 100, 180, 300, 120]
const FRECCIA_SX = 4291652
const FRECCIA_DX = 4488452

control.inBackground(function () {
    let f = 0
    let ultima = 0
    while (true) {
        if (modoDisplay == 4 && !frecciaAttiva && animazione > 0 && animazione < animStart.length) {
            if (animazione != ultima) {
                f = 0
                ultima = animazione
            }
            disegnaMaschera(animFrames[animStart[animazione] + (f % animCount[animazione])])
            f++
            basic.pause(animMs[animazione])
        } else {
            ultima = 0
            basic.pause(50)
        }
    }
})

// =================== EFFETTI FARI (sempre in sottofondo) ===================
let arcobaleno = [0xff0000, 0xff6000, 0xffd000, 0x80ff00, 0x00ff40, 0x00ffd0, 0x0080ff, 0x2000ff, 0xa000ff, 0xff00a0]
let battito = [1, 0, 1, 0, 0, 0, 0, 0, 0, 0]
let polizia = [1, 0, 1, 0, 2, 0, 2, 0]
control.inBackground(function () {
    let p = 0
    while (true) {
        if (effetto == 1) {                   // respiro
            let k = p % 40
            if (k > 20) {
                k = 40 - k
            }
            fariScala(k * 5)
            basic.pause(50)
        } else if (effetto == 2) {            // lampeggia
            if (p % 2 == 0) { fariScala(100) } else { fari(0, 0, 0) }
            basic.pause(300)
        } else if (effetto == 3) {            // battito (tu-tum ... tu-tum)
            if (battito[p % 10] == 1) { fariScala(100) } else { fari(0, 0, 0) }
            basic.pause(100)
        } else if (effetto == 4) {            // ping pong: un faro alla volta
            if (p % 2 == 0) {
                faroSinistro(colR, colG, colB)
                faroDestro(0, 0, 0)
            } else {
                faroSinistro(0, 0, 0)
                faroDestro(colR, colG, colB)
            }
            basic.pause(250)
        } else if (effetto == 5) {            // frecce: lampeggia il lato verso cui si curva
            let acceso = p % 2 == 0
            let sinistra = ultimoSx < ultimoDx - 10
            let destra = ultimoDx < ultimoSx - 10
            if (sinistra && acceso) { faroSinistro(255, 110, 0) } else if (sinistra) { faroSinistro(0, 0, 0) } else { faroSinistro(colR, colG, colB) }
            if (destra && acceso) { faroDestro(255, 110, 0) } else if (destra) { faroDestro(0, 0, 0) } else { faroDestro(colR, colG, colB) }
            // freccia lampeggiante anche sul display
            if (sinistra || destra) {
                frecciaAttiva = true
                if (!acceso) {
                    basic.clearScreen()
                } else if (sinistra) {
                    disegnaMaschera(FRECCIA_SX)
                } else {
                    disegnaMaschera(FRECCIA_DX)
                }
            } else if (frecciaAttiva) {
                frecciaAttiva = false
                mostraDisplay()
            }
            basic.pause(350)
        } else if (effetto == 6) {            // arcobaleno
            let c = arcobaleno[p % arcobaleno.length]
            fari((c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff)
            basic.pause(150)
        } else if (effetto == 7) {            // disco: colori a caso, diversi a sinistra e a destra
            let c1 = arcobaleno[randint(0, 9)]
            let c2 = arcobaleno[randint(0, 9)]
            faroSinistro((c1 >> 16) & 0xff, (c1 >> 8) & 0xff, c1 & 0xff)
            faroDestro((c2 >> 16) & 0xff, (c2 >> 8) & 0xff, c2 & 0xff)
            basic.pause(180)
        } else if (effetto == 8) {            // polizia: doppi lampi rossi e blu
            let s = polizia[p % 8]
            if (s == 1) {
                fari(255, 0, 0)
            } else if (s == 2) {
                fari(0, 0, 255)
            } else {
                fari(0, 0, 0)
            }
            basic.pause(80)
        } else if (effetto == 9) {            // semaforo: verde, giallo, rosso
            let fase = p % 7
            if (fase < 3) {
                fari(0, 255, 0)
            } else if (fase < 4) {
                fari(255, 160, 0)
            } else {
                fari(255, 0, 0)
            }
            basic.pause(500)
        } else if (effetto == 10) {           // candela: luce calda che tremola
            let k = randint(45, 100)
            fari(Math.idiv(255 * k, 100), Math.idiv(randint(60, 110) * k, 100), 0)
            basic.pause(randint(40, 140))
        } else if (effetto == 11) {           // strobo
            fari(255, 255, 255)
            basic.pause(30)
            fari(0, 0, 0)
            basic.pause(110)
        } else {
            basic.pause(100)
        }
        p++
    }
})

function impostaEffetto(n: number) {
    effetto = n
    if (frecciaAttiva) {
        frecciaAttiva = false
        mostraDisplay()
    }
    if (n == 0) {
        fari(colR, colG, colB)
    }
}

// =================== BLUETOOTH ===================
music.setBuiltInSpeakerEnabled(false)   // niente suoni
impostaMotori(0, 0)
fari(colR, colG, colB)
bluetooth.startUartService()

bluetooth.onBluetoothConnected(function () {
    connesso = true
    mostraDisplay()
})

bluetooth.onBluetoothDisconnected(function () {
    connesso = false
    impostaMotori(0, 0)
    inMovimento = false
    basic.showIcon(IconNames.No)
})

// Messaggi dal telecomando:
//   "sinistro,destro#"  ruote             "CIAO#"     chiede la lettera del giocatore
//   "COL:r,g,b#"        colore fari       "LUC:n#"    effetto fari (0-11)
//   "LUM:n#"            luminosità fari (10-100)
//   "PIX:n#"            disegno display   "ANI:n#"    animazione display (1-48)
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.Hash), function () {
    let m = bluetooth.uartReadUntil(serial.delimiters(Delimiters.Hash))
    let cmd = m.substr(0, 4)
    let arg = m.substr(4, m.length - 4)

    if (m == "CIAO") {
        bluetooth.uartWriteString("ID:" + GIOCATORE + "#")
        return
    }
    if (cmd == "COL:") {
        let c = arg.split(",")
        if (c.length == 3) {
            colR = Math.constrain(parseInt(c[0]), 0, 255)
            colG = Math.constrain(parseInt(c[1]), 0, 255)
            colB = Math.constrain(parseInt(c[2]), 0, 255)
            if (effetto > 5) {          // gli effetti con colori propri tornano a "fisso"
                effetto = 0
            }
            if (effetto == 0) {
                fari(colR, colG, colB)
            }
        }
        return
    }
    if (cmd == "LUC:") {
        impostaEffetto(parseInt(arg))
        return
    }
    if (cmd == "LUM:") {
        lum = Math.constrain(parseInt(arg), 10, 100)
        if (effetto == 0) {
            fari(colR, colG, colB)
        }
        return
    }
    if (cmd == "PIX:") {
        disegno = parseInt(arg)
        modoDisplay = 1
        mostraDisplay()
        return
    }
    if (cmd == "ANI:") {
        animazione = parseInt(arg)
        modoDisplay = 4
        return
    }

    let parti = m.split(",")
    if (parti.length == 2) {
        let sx = Math.constrain(parseInt(parti[0]), -100, 100)
        let dx = Math.constrain(parseInt(parti[1]), -100, 100)
        impostaMotori(sx, dx)
        ultimoSx = sx
        ultimoDx = dx
        inMovimento = sx != 0 || dx != 0
        ultimoComando = input.runningTime()
    }
})

// Sicurezza: se non arrivano comandi per un secondo, si ferma
basic.forever(function () {
    if (inMovimento && input.runningTime() - ultimoComando > 1000) {
        impostaMotori(0, 0)
        ultimoSx = 0
        ultimoDx = 0
        inMovimento = false
    }
    basic.pause(50)
})

// =================== PULSANTI DEL ROBOT ===================
input.onButtonPressed(Button.A, function () {
    modoDisplay = 0                     // A: il display torna a mostrare la lettera del giocatore
    mostraDisplay()
})
input.onButtonPressed(Button.B, function () {
    impostaMotori(60, -60)              // prova: gira 1 secondo
    basic.pause(1000)
    impostaMotori(0, 0)
})
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    impostaEffetto((effetto + 1) % 12)  // logo: effetto fari successivo
})

mostraDisplay()
