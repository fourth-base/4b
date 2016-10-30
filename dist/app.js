var horizon = new Horizon({ authType: 'anonymous' });
var users = horizon('users');
var sessions = horizon('sessions');
var currentState = {
    userId: undefined,
    session: undefined,
    sessionId: undefined,
    stage: undefined,
    voted: false,
    voteCount: 0
};

horizon
    .currentUser()
    .watch()
    .subscribe(
        user => {
            currentState.userId = user.id;
            currentState.voted = user.voted;
            if(user.session) {
                currentState.session = sessions
                                        .find(user.session)
                                        .watch()
                                        .subscribe(session => {
                                            currentState.sessionId = session.id;
                                            currentState.stage = session.stage;
                                            currentState.voteCount = session.voteCount;
                                            console.log(JSON.stringify(session));
                                        });
            } else {
                if(currentState.session) {
                    currentState.session.unsubscribe();
                }
                currentState.session = undefined;
                currentState.sessionId = undefined;
                currentState.voteCount = 0;
                currentState.voted = false;
                currentState.stage = undefined;
            }
            console.log(JSON.stringify(user));
        }
    );

function userVote() {
    if (!currentState.voted) {
        users.update({id: currentState.userId, voted: true});
        sessions.update({id: currentState.sessionId, voteCount: currentState.voteCount+1});
    }
}