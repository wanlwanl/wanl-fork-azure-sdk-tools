QUnit.moduleStart = function(settings){
    console.log(`##[debug]testSuitStarted name = ${settings.name}`);
};

QUnit.moduleDone = function(settings){
    console.log(`##[debug]testSuitFinished name = ${settings.name}`);
};

QUnit.testStart = function(settings){
    console.log(`##[debug]testStarted name = ${settings.name}`);
};

QUnit.testDone = function(settings){
    if (settings.failed > 0){
        for (const failure in settings.failed)
        {
            console.log(`##[error]testFailed name = ${settings.name} , message = 'Assertion failed: ${failure}'`);
        }
        console.log(`##[debug]testFinished name = ${settings.name}`); 
    }
};