var RaneFour = {}; // Cambiado a minúsculas y sin espacios

// Inicialización del scratching
RaneFour.init = function() {
    print("Cargo el script correctamente bien!!");

    // Habilitar scratching para el deck 1 (rueda izquierda)
    engine.scratchEnable(1, RaneFour.scratchSettings.jogResolution, RaneFour.scratchSettings.vinylSpeed, 1.0, 1.0, true);

    // Habilitar scratching para el deck 2 (rueda derecha)
    engine.scratchEnable(2, RaneFour.scratchSettings.jogResolution, RaneFour.scratchSettings.vinylSpeed, 1.0, 1.0, true);
};

RaneFour.shutdown = function() {
    print("Rane Four custom script shutting down");
    engine.scratchDisable(1);
    engine.scratchDisable(2);
};

RaneFour.handleCue = function(channel, control, value, status, group) {
    if (value) {
        engine.setValue(group, "cue_default", 1);
    }
};

// Configuración de scratching
RaneFour.scratchSettings = {
    jogResolution: 3600, // Resolución del jog wheel (ajústalo según tu controlador)
    vinylSpeed: 33.3     // Velocidad del vinilo (33.3 RPM)
};

// Manejar el evento de presionar la rueda derecha
RaneFour.handleRightWheelPress = function(channel, control, value, status, group) {
    
    if (value > 0) { // Si la rueda está presionada
        print("DEBUG: Rueda derecha presionada - grupo=" + group);

        // Desacelerar gradualmente la música
        let rate = engine.getValue(group, "rate");
        let interval = setInterval(function() {
            if (rate > 0) {
                rate -= 0.01;
                engine.setValue(group, "rate", rate);
            } else {
                clearInterval(interval);
            }
        }, 50);
    }
};

// Manejar el evento de soltar la rueda derecha
RaneFour.handleRightWheelRelease = function(channel, control, value, status, group) {
    if (value === 0) { // Si la rueda está liberada
        print("DEBUG: Rueda derecha liberada - grupo=" + group);

        // Reanudar la reproducción normal
        engine.setValue(group, "rate", 1);
    }
};

// Manejar el evento de presionar la rueda izquierda
RaneFour.handleLeftWheelPress = function(channel, control, value, status, group) {
    if (value > 0) { // Si la rueda está presionada
        print("DEBUG: Rueda izquierda presionada - grupo=" + group);

        // Desacelerar gradualmente la música
        let rate = engine.getValue(group, "rate"); // Obtener el valor actual del pitch
        let interval = setInterval(function() {
            if (rate > 0) {
                rate -= 0.01; // Reducir la velocidad gradualmente
                engine.setValue(group, "rate", rate);
            } else {
                clearInterval(interval); // Detener el intervalo cuando la velocidad llegue a 0
            }
        }, 50); // Reducir la velocidad cada 50 ms
    }
};

// Manejar el evento de soltar la rueda izquierda
RaneFour.handleLeftWheelRelease = function(channel, control, value, status, group) {
    if (value === 0) { // Si la rueda está liberada
        print("DEBUG: Rueda izquierda liberada - grupo=" + group);

        // Reanudar la reproducción normal
        engine.setValue(group, "rate", 1); // Restaurar la velocidad normal
    }
};

// Variable para almacenar la velocidad inicial y los temporizadores de cada deck
RaneFour.initialRates = {};
RaneFour.resetTimers = {};

// Manejar el movimiento de la rueda izquierda
RaneFour.handleLeftWheel = function (channel, control, value, status, group) {
    print("DEBUG: Rueda izquierda activada - valor=" + value + ", grupo=" + group);

    // Si no se ha almacenado la velocidad inicial, guardarla
    if (RaneFour.initialRates[group] === undefined) {
        RaneFour.initialRates[group] = engine.getValue(group, "rate");
    }

    // Cancelar cualquier temporizador previo para evitar restaurar la velocidad mientras se mueve el jog wheel
    if (RaneFour.resetTimers[group]) {
        engine.stopTimer(RaneFour.resetTimers[group]);
        delete RaneFour.resetTimers[group];
    }

    // Calcular el movimiento del jog wheel
    let jogDelta = value - 128; // El jog wheel está centrado en 64 (0x40)
    let jogSensitivity = 0.005; // Sensibilidad del nudge (ajustable)
    let currentRate = RaneFour.initialRates[group];

    // Ajustar temporalmente la velocidad
    let newRate = currentRate + (jogDelta * jogSensitivity);
    engine.setValue(group, "rate", newRate);

    // Configurar un temporizador para restaurar la velocidad inicial después de 200 ms de inactividad
    RaneFour.resetTimers[group] = engine.beginTimer(200, function () {
        engine.setValue(group, "rate", RaneFour.initialRates[group]);
        delete RaneFour.initialRates[group]; // Limpiar la velocidad inicial almacenada
        delete RaneFour.resetTimers[group]; // Limpiar el temporizador
    }, true); // El tercer parámetro "true" asegura que el temporizador se ejecute solo una vez
};

// Manejar el movimiento de la rueda derecha
RaneFour.handleRightWheel = function (channel, control, value, status, group) {
    print("DEBUG: Rueda derecha activada - valor=" + value + ", grupo=" + group);

    // Si no se ha almacenado la velocidad inicial, guardarla
    if (RaneFour.initialRates[group] === undefined) {
        RaneFour.initialRates[group] = engine.getValue(group, "rate");
    }

    // Cancelar cualquier temporizador previo para evitar restaurar la velocidad mientras se mueve el jog wheel
    if (RaneFour.resetTimers[group]) {
        engine.stopTimer(RaneFour.resetTimers[group]);
        delete RaneFour.resetTimers[group];
    }

    // Calcular el movimiento del jog wheel
    let jogDelta = value - 64; // El jog wheel está centrado en 64 (0x40)
    let jogSensitivity = 0.005; // Sensibilidad del nudge (ajustable)
    let currentRate = RaneFour.initialRates[group];

    // Ajustar temporalmente la velocidad
    let newRate = currentRate + (jogDelta * jogSensitivity);
    engine.setValue(group, "rate", newRate);

    // Configurar un temporizador para restaurar la velocidad inicial después de 200 ms de inactividad
    RaneFour.resetTimers[group] = engine.beginTimer(2000, function () {
        engine.setValue(group, "rate", RaneFour.initialRates[group]);
        delete RaneFour.initialRates[group]; // Limpiar la velocidad inicial almacenada
        delete RaneFour.resetTimers[group]; // Limpiar el temporizador
    }, true); // El tercer parámetro "true" asegura que el temporizador se ejecute solo una vez
};
// // The wheel that actually controls the scratching
// RaneFour.wheelTurn = function (channel, control, value, status, group) {
//     // --- Choose only one of the following!
    
//     // A: For a control that centers on 0:
//     var newValue;
//     if (value < 64) {
//         newValue = value;
//     } else {
//         newValue = value - 128;
//     }

//     // B: For a control that centers on 0x40 (64):
//     var newValue = value - 64;
    
//     // --- End choice
    
//     // In either case, register the movement
//     var deckNumber = script.deckFromGroup(group);
//     if (engine.isScratching(deckNumber)) {
//         engine.scratchTick(deckNumber, newValue); // Scratch!
//     } else {
//         engine.setValue(group, 'jog', newValue); // Pitch bend
//     }
// }
RaneFour.wheelTurn = function (channel, control, value, status, group) {
    // Calcular el movimiento del jog wheel
    var jogDelta = value - 64; // El jog wheel está centrado en 64 (0x40)

    // Determinar el número del deck a partir del grupo
    var deckNumber = script.deckFromGroup(group);

    // Si el scratching está habilitado, ajustar el scratching
    if (engine.isScratching(deckNumber)) {
        engine.scratchTick(deckNumber, jogDelta); // Realizar scratching
    } else {
        // Si no está en modo scratching, ajustar el pitch (nudge)
        var jogSensitivity = 0.005; // Sensibilidad del nudge (ajustable)
        var currentRate = engine.getValue(group, "rate");
        var newRate = currentRate + (jogDelta * jogSensitivity);
        engine.setValue(group, "rate", newRate); // Ajustar el pitch
    }
};

RaneFour.testFunction = function(channel, control, value, status, group) {
    print("DEBUG: testFunction ejecutada - valor=" + value + ", grupo=" + group);
};

