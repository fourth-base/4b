var horizon = new Horizon({ authType: 'anonymous' });
var users = horizon('users');
var sessions = horizon('sessions');
var currentState = {
    session : undefined,
    stage : undefined
};

horizon
    .currentUser()
    .watch()
    .subscribe(
        user => {
            if(user.session) {
                currentState.session = sessions
                                    .find(user.session)
                                    .watch()
                                    .subscribe(session => {
                                        currentState.stage = session.stage;
                                        console.log(JSON.stringify(session));
                                    });
            } else {
                if(currentState.session) {
                    currentState.session.unsubscribe();
                }
                currentState.session = undefined;
                currentState.stage = undefined;
            }
            console.log(JSON.stringify(user));
        }
    );