var RaneFour = {};

//colorines led varios serato
// The SysEx message to send to the controller to force the midi controller
// to send the status of every item on the control surface.

//var ControllerStatusSysex = [0xF0, 0x00, 0x20, 0x7F, 0x03, 0x01, 0xF7];

// After midi controller receive this Outbound Message request SysEx Message,
// midi controller will send the status of every item on the
// control surface. (Mixxx will be initialized with current values)
//midi.sendSysexMsg(ControllerStatusSysex, ControllerStatusSysex.length);
// eslint-disable-next-line no-var

/*colorines led varios general
MyController.init = function (id, debugging) {
   
    // turn on all LEDs
    for (let i = 1; i <= 40; i++) { // Repeat the following code for the numbers 1 through 40
                                // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for
        midi.sendShortMsg(0x90, i, 0x7f);
    }
 
}
    

MyController.shutdown = function() {
 /* 
   // turn off all LEDs
   for (let i = 1; i <= 40; i++) {
        midi.sendShortMsg(0x90, i, 0x00);
    }
} */
// https://github.com/mixxxdj/mixxx/wiki/MIDI%20Scripting 

/*
si es scrach aparecen estos valores en Status y se salta numeros
el mio absoluto va de 0x00 > status 0x81 (ch 2, opcode 0x8), ctrl 0x50, val 0x00"
los demas valores > status 0xB1 (ch 2, opcode 0xB), ctrl 0x06, val 0x01"
a 0x7F borde del plato >status 0x91 (ch 2, opcode 0x9), ctrl 0x50, val 0x7F"

si no siempre el status es 0xB1
status 0x81 (ch 2, opcode 0x8), ctrl 0x50, val 0x00"
status 0x91 (ch 2, opcode 0x9), ctrl 0x50, val 0x7F"
status 0x81 (ch 2, opcode 0x8), ctrl 0x50, val 0x00"
status 0xB1 (ch 2, opcode 0xB), ctrl 0x06, val 0x4D"
status 0xB1 (ch 2, opcode 0xB), ctrl 0x06, val 0x4C"
status 0xB1 (ch 2, opcode 0xB), ctrl 0x06, val 0x4B"

*/


/* De ChatGPT Juan no funciona */
function jogWheel(channel, control, value, status, group) {
    var jogSpeed = 0.01; // Sensibilidad del jog
    if (value > 64) { 
        engine.setValue(group, "jog", jogSpeed);
    } else {
        engine.setValue(group, "jog", -jogSpeed);
    }
}

// Objeto para almacenar información del jog wheel 
var jogState = { 
    lastValue: 0, 
    /* Último valor recibido */ lastTime: 0, 
    /* Última marca de tiempo */ threshold: 10, 
    /* Umbral de velocidad para definir rápido/lento (ajustable) */  
};
/*
Sí, podemos crear un script en JavaScript para Mixxx que detecte la velocidad de cambio en los valores del jog wheel y así diferenciar entre un movimiento rápido o lento.
📜 Explicación del Script
Detecta los valores de entrada MIDI del jog wheel.
Calcula la diferencia entre el valor actual y el valor anterior.
Mide el tiempo entre cambios para estimar la velocidad.
Clasifica el movimiento como lento o rápido según un umbral.
*/
function jogWheelSpeedDetector(channel, control, value, status, group) { 
    var currentTime = new Date().getTime(); 
    // Obtener tiempo actual en milisegundos 
    var timeDiff = currentTime - jogState.lastTime; 
    // Diferencia de tiempo entre eventos 
    var valueDiff = Math.abs(value - jogState.lastValue); 
    // Diferencia en valores recibidos 
    if (jogState.lastTime > 0) { 
        // Evitar la primera lectura sin referencia 
        var speed = valueDiff / timeDiff; 
        // Razón de cambio (velocidad) 
        if (speed > jogState.threshold) { 
            print("🔵 Movimiento RÁPIDO detectado! Speed: " + speed.toFixed(2)); 
        } else { 
            print("🟢 Movimiento LENTO detectado! Speed: " + speed.toFixed(2)); 
        } 
    } 
    // Actualizar los valores para la próxima iteración 
    jogState.lastTime = currentTime; jogState.lastValue = value; 
    } 


//Jog wheel moved without pressure (for seeking, speeding or slowing down, or navigating) borde de plato velocidad
RaneFour.jogWheel = function(midichan, control, value, status, groupInitial) {
    //It has a speed sensor, but you have to move it really fast for it to send something different.
    var direction = (value < 0xB1) ? value : value - 0x06;
    if (RaneFour.navigationStatus.enabled) {
        if (RaneFour.navigationStatus.timeoutId !== null) {
            //Stop key-repeat mode. From now on, obey only jog movement until button is released.
            engine.stopTimer(RaneFour.navigationStatus.timeoutId);
            RaneFour.navigationStatus.timeoutId = null;
        }
        RaneFour.navigationStatus.direction = direction;
        RaneFour.doNavigateAction();
    } else {
        var group = (RaneFour.previewOnDeck[groupInitial]) ? '[PreviewDeck1]' : groupInitial;
        if (RaneFour.userSettings.useSingleJogWheelHack === true
                && RaneFour.swapJogWheel === true) {
            group = RaneFour.rightJogWheelGroup;
        }
        engine.setValue(group, "jog", direction + engine.getValue(group, "jog"));
    }
};

// The "scratch" button is used to enable or disable scratching on the jog wheels.
// Concretely, it tells if it has to ignore or not the pressure sensor in the jog wheel.
RaneFour.scratchButton = function(midichan, control, value, status, group) {
    if (value) {
        if (RaneFour.scratchEnabled) {
            RaneFour.scratchEnabled = false;
            midi.sendShortMsg(RaneFour.NOnC1, 0xB1, 0x06); /*cambiado*/
            if (RaneFour.userSettings.crossfaderScratchCurve) {
                midi.sendShortMsg(RaneFour.CC, 0x7E, 0x00);
            }
        } else {
            RaneFour.scratchEnabled = true;
            midi.sendShortMsg(RaneFour.NOnC1, 0x3D, 0x7F);
            if (RaneFour.userSettings.crossfaderScratchCurve) {
                midi.sendShortMsg(RaneFour.CC, 0x7E, 0x7F);
            }
        }
    }
};
// The pressure action over the jog wheel
RaneFour.wheelTouch = function(midichan, control, value, status, groupInitial) {
    //Scratching does not work with the previewdeck.
    if (RaneFour.previewOnDeck[groupInitial] === false) {
        var group = (RaneFour.previewOnDeck[groupInitial]) ? '[PreviewDeck1]' : groupInitial;
        if (RaneFour.scratchEnabled && value) {
            // If button down
            engine.scratchEnable(script.deckFromGroup(group),
                256 * RaneFour.userSettings.sensitivity,
                RaneFour.userSettings.vinylSpeed,
                RaneFour.userSettings.alpha,
                RaneFour.userSettings.beta);
        } else {
            // If button up
            engine.scratchDisable(script.deckFromGroup(group));
        }
        RaneFour.swapJogWheel = (value > 0);
    }
};
//Jog wheel used with pressure (for scratching)
RaneFour.scratchWheel = function(midichan, control, value, status, groupInitial) {
    if (RaneFour.navigationStatus.enabled ||
        !engine.isScratching(script.deckFromGroup(groupInitial))) {
        //If navigating, or not in scratch mode, do jogWheel
        RaneFour.jogWheel(midichan, control, value, status, groupInitial);
    } else {
        //It has a speed sensor, but you have to move it really fast for it to send something different.
        var direction = (value < 0x40) ? value : value - 0x80;
        var group = (RaneFour.previewOnDeck[groupInitial]) ? '[PreviewDeck1]' : groupInitial;
        engine.scratchTick(script.deckFromGroup(group), direction);
    }
};



/* ------------------------------------------------------------------------------- ---------------------------------------------
// Movimiento del jog sin presión (para buscar, acelerar, ralentizar o navegar)
RaneFour.jogWheel = function(midichan, control, value, status, groupInicial) {
    var direccion = (value < 0x40) ? value : value - 0x80;
    if (RaneFour.navigationStatus.enabled) {
        if (RaneFour.navigationStatus.timeoutId !== null) {
            // Detener el modo de repetición de tecla. A partir de ahora, obedecer solo el movimiento del jog hasta que se suelte el botón.
            engine.stopTimer(RaneFour.navigationStatus.timeoutId);
            RaneFour.navigationStatus.timeoutId = null;
        }
        RaneFour.navigationStatus.direction = direccion;
        RaneFour.doNavigateAction();
    } else {
        var group = (RaneFour.previewOnDeck[groupInicial]) ? '[PreviewDeck1]' : groupInicial;
        engine.setValue(group, "jog", direccion + engine.getValue(group, "jog"));
    }
};

// El botón de "scratch" habilita o deshabilita el modo scratch en los jog wheels.
RaneFour.scratchButton = function(midichan, control, value, status, group) {
    if (value) {
        RaneFour.scratchEnabled = !RaneFour.scratchEnabled; // Alternar entre habilitado y deshabilitado
        var msgValue = RaneFour.scratchEnabled ? 0x7F : 0x00;
        midi.sendShortMsg(RaneFour.NOnC1, 0x3D, msgValue);
        if (RaneFour.userSettings.crossfaderScratchCurve) {
            midi.sendShortMsg(RaneFour.CC, 0x7E, msgValue);
        }
    }
};

// Acción de presión en el jog wheel
RaneFour.wheelTouch = function(midichan, control, value, status, groupInicial) {
    if (!RaneFour.previewOnDeck[groupInicial]) {
        var group = (RaneFour.previewOnDeck[groupInicial]) ? '[PreviewDeck1]' : groupInicial;
        if (RaneFour.scratchEnabled && value) {
            // Si se presiona el botón
            engine.scratchEnable(script.deckFromGroup(group),
                256 * RaneFour.userSettings.sensitivity,
                RaneFour.userSettings.vinylSpeed,
                RaneFour.userSettings.alpha,
                RaneFour.userSettings.beta);
        } else {
            // Si se suelta el botón
            engine.scratchDisable(script.deckFromGroup(group));
        }
        RaneFour.swapJogWheel = (value > 0);
    }
};

// Jog wheel usado con presión (para scratching)
RaneFour.scratchWheel = function(midichan, control, value, status, groupInicial) {
    if (RaneFour.navigationStatus.enabled ||
        !engine.isScratching(script.deckFromGroup(groupInicial))) {
        RaneFour.jogWheel(midichan, control, value, status, groupInicial);
    } else {
        var direccion = (value < 0x40) ? value : value - 0x80;
        var group = (RaneFour.previewOnDeck[groupInicial]) ? '[PreviewDeck1]' : groupInicial;
        engine.scratchTick(script.deckFromGroup(group), direccion);
    }
};


RaneFour.sendSongInfo = function(group) {
    // Obtener datos de la canción
    var bpm = engine.getValue(group, "bpm");
    var duration = engine.getValue(group, "duration"); // en segundos
    var key = engine.getValue(group, "key");

    // Enviar mensajes MIDI
    // Mandar BPM (asegúrate de escalar a rango MIDI 0-127 si es necesario)
    var bpmValue = Math.min(127, Math.max(0, Math.round(bpm))); // Escalar al rango MIDI
    midi.sendShortMsg(0xB0, 0x10, bpmValue); // Mensaje MIDI CC

    // Mandar duración (asumiendo que se escala a minutos, rango 0-127)
    var durationMinutes = Math.min(127, Math.max(0, Math.round(duration / 60))); // En minutos
    midi.sendShortMsg(0xB0, 0x11, durationMinutes); // Mensaje MIDI CC

    // Mandar tonalidad como string (convertir a un código numérico representativo)
    var keyMap = {
        "C": 0,
        "C#": 1,
        "D": 2,
        "D#": 3,
        "E": 4,
        "F": 5,
        "F#": 6,
        "G": 7,
        "G#": 8,
        "A": 9,
        "A#": 10,
        "B": 11
    };
    var keyValue = keyMap[key] || 0; // Convertir la tonalidad a un valor MIDI
    midi.sendShortMsg(0xB0, 0x12, keyValue); // Mensaje MIDI CC
};



/* Otros
Sí, entiendo lo que estás viendo en el modo DEBUG de Mixxx. Esto es un registro en tiempo real de los mensajes MIDI que recibe el software cuando interactúas con un componente del controlador Rane FOUR.

Explicación de la salida DEBUG

Cada línea representa un mensaje MIDI entrante que Mixxx está procesando. Vamos a desglosarlo:

Ejemplo de una línea de log:

debug [Controller] "incoming: #2~ Rane FOUR Control: t:2299478 ms status 0xB1 (ch 2, opcode 0xB), ctrl 0x06, val 0x3C"

¿Qué significa cada parte?

debug [Controller] "incoming: → Indica que es un mensaje MIDI entrante.

#2~ Rane FOUR Control: → Número de controlador y su nombre asignado en Mixxx.

t:2299478 ms → Tiempo en milisegundos desde el inicio de la sesión.

status 0xB1 → Código de estado MIDI:

0xB1 indica que es un "Control Change" (CC) en el canal 2.


(ch 2, opcode 0xB) → Especifica el canal MIDI (2) y el tipo de mensaje (Control Change).

ctrl 0x06 → El número de controlador MIDI (Control Change). Este valor cambia según el componente que muevas en la consola.

val 0x3C → Valor enviado. Indica la posición o intensidad del control.



---

¿Cómo interpretar esto para mapear un controlador?

Si quieres mapear un jog wheel, fader, botón o knob, necesitas capturar los valores ctrl y val:

1. Mueve el componente en tu controlador y observa la consola.


2. Anota el número ctrl que aparece (en este caso 0x06).


3. Registra los valores val que genera el movimiento.

Un fader o knob enviará valores entre 0x00 (mínimo) y 0x7F (máximo).

Un jog wheel puede enviar una serie de valores rápidos al moverse.

Un botón enviará 0x7F cuando se presiona y 0x00 cuando se suelta.



4. Usa estos valores en tu script de Mixxx.

Si estás escribiendo un script en JavaScript, puedes asignar acciones a cada ctrl.





---

Ejemplo de mapeo en script (.js de Mixxx)

Si quisieras mapear el controlador 0x06 a una función de scratch, podrías hacerlo así:

function jogWheel(channel, control, value, status, group) {
    var jogSpeed = 0.01; // Sensibilidad del jog
    if (value > 64) { 
        engine.setValue(group, "jog", jogSpeed);
    } else {
        engine.setValue(group, "jog", -jogSpeed);
    }
}

Y en el archivo .xml lo asignarías así:

<Control name="jog_wheel" channel="2" midi="0xB1" control="0x06" function="jogWheel"/>


---

Errores o Advertencias en el log

1. Mensajes tipo warning [Main] CoverArtDelegate - Failed to load cover

Indican que Mixxx no puede cargar la imagen de la portada de una pista.

No afecta al mapeo MIDI, pero puede ser molesto si ves muchas advertencias.





---

Conclusión

Tu salida en DEBUG confirma que Mixxx está recibiendo correctamente mensajes MIDI de tu controlador Rane FOUR. Ahora puedes usar estos datos para mapear controles personalizados en un script MIDI.

Si necesitas ayuda con un script específico o quieres hacer algo avanzado (como scratching, efectos, loops), dime qué función deseas mapear y te ayudo a escribir el código.



---------------------------------------------------------------
Sí, podemos crear un script en JavaScript para Mixxx que detecte la velocidad de cambio en los valores del jog wheel y así diferenciar entre un movimiento rápido o lento.
📜 Explicación del Script
Detecta los valores de entrada MIDI del jog wheel.
Calcula la diferencia entre el valor actual y el valor anterior.
Mide el tiempo entre cambios para estimar la velocidad.
Clasifica el movimiento como lento o rápido según un umbral.
📝 Código en JavaScript para Mixxx
// Objeto para almacenar información del jog wheel 
var jogState = { lastValue: 0, 
Último valor recibido lastTime: 0, 
Última marca de tiempo threshold: 10, 
Umbral de velocidad para definir rápido/lento (ajustable) };
Función que se ejecuta cuando se gira el jog wheel 

function jogWheelSpeedDetector(channel, control, value, status, group) { var currentTime = new Date().getTime(); // Obtener tiempo actual en milisegundos var timeDiff = currentTime - jogState.lastTime; // Diferencia de tiempo entre eventos var valueDiff = Math.abs(value - jogState.lastValue); // Diferencia en valores recibidos if (jogState.lastTime > 0) { // Evitar la primera lectura sin referencia var speed = valueDiff / timeDiff; // Razón de cambio (velocidad) if (speed > jogState.threshold) { print("🔵 Movimiento RÁPIDO detectado! Speed: " + speed.toFixed(2)); } else { print("🟢 Movimiento LENTO detectado! Speed: " + speed.toFixed(2)); } } // Actualizar los valores para la próxima iteración jogState.lastTime = currentTime; jogState.lastValue = value; } 
🔗 Integración con Mixxx
Para que este código funcione, debes vincularlo en el archivo XML de tu controlador:
<Control name="jog_wheel" channel="2" midi="0xB1" control="0x06" function="jogWheelSpeedDetector"/> 
🛠️ Cómo Funciona
El script mide la velocidad de cambio del jog wheel.
Si el cambio es mayor al umbral (threshold), se considera un giro rápido.
Si es menor, se considera un giro lento.
El resultado se imprime en la consola de Mixxx (print).
📝 Notas
Puedes ajustar el umbral (threshold) según la sensibilidad que necesites.
Para probarlo, activa el modo DEBUG en Mixxx y mueve el jog wheel.
Si necesitas integrar esto con scratching o pitch bending, dime y lo ajustamos.
¡Déjame saber si necesitas mejoras o más ajustes! 🚀
Allí tienes un script de ejemplo para saber la razón de cambio, es simplemente capturar un valor dividirlo en un rango de tiempo y compararlo con una referencia, si es mayor a tal movimiento rápido, menor a tal movimiento lento.


*/