var horizon = new Horizon({ authType: 'anonymous' });
var users = horizon('users');
var sessions = horizon('sessions');
var currentState = {
    session : undefined,
    stage : undefined,
    voted : false,
    voteCount : 0
};

horizon
    .currentUser()
    .watch()
    .subscribe(
        user => {
            currentState.voted = user.voted;
            if(user.session) {
                currentState.session = sessions
                                        .find(user.session)
                                        .watch()
                                        .subscribe(session => {
                                            currentState.stage = session.stage;
                                            currentState.voteCount = session.voteCount;
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

function userVote() {
    horizon.currentUser().update({voted:true});
    currentState.session.update({voteCount : currentState++});
}