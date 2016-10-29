const horizon = new Horizon({ authType: 'anonymous' });
const users = horizon('users');
const sessions = horizon('sessions');

horizon
    .currentUser()
    .watch()
    .subscribe(user => console.log(JSON.stringify(user)));