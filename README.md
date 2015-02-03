Gookie
======

Small and highly configurable node server for handling your [GitHub Webhooks](https://developer.github.com/webhooks/).

Inspired by [GitHub Auto Deploy](https://github.com/logsol/Github-Auto-Deploy) which was written in Python and designed only for pull requests. Gookie is written in Node.js and is just as friendly; but it prints deploy script output and is more configurable. It was designed to solve one or two of the problems we ran into at the [eth0 hackathon](https://github.com/hoxxep/eth0-Hackathon), such as mentioning in the terminal that a ping event occurred and showing errors during git pull/our deploy script.

To run Gookie in daemon mode, I recommend checking out [forever](https://www.npmjs.com/package/forever). A really sleek npm package for stopping/starting/running other npm scripts like services.

Getting Started
---------------

1. Download Gookie or clone the repo (`git clone https://github.com/hoxxep/Gookie`).
2. Copy `config-example.json` to `config.json` and then configure the port for your [webhook](https://developer.github.com/webhooks/) and a github repository.
    - Also create or configure a logging directory too, and manually create the folder.
3. Run `npm install` to install local dependencies.
4. Run `node Gookie.js` to start the server.
5. Test your Gookie server is running by visiting your ip:port in a browser.
    - *Troubleshooting:* you may have to open ports if your router/firewall is restricting your chosen port. You can use [ngrok](https://ngrok.com/) as a temporary solution.
6. Configure your [webhook](https://developer.github.com/webhooks/) by visiting your repo settings on GitHub.
    - Enter the url of your machine and the port, and specify content type as application/json.

Configuration
-------------

### Command-line args

- `-q` or `--quiet`: Reduce the amount of [console] output from Gookie. They still print deploy script output (in case
 an error occurs).
- `-v` or `--verbose`: Show user pushing to which repo and some other extra output [in both gookie.log and console
output].

### config.json

Example `config.json`:

```JSON
{
  "port": 8001,
  "log": {
    "directory": "logs"
  },
  "repositories": [
    {
      "url": "https://github.com/hoxxep/Gookie",
      "path": "~/Documents/Projects/Gookie",
      "deploy": "sh pull-and-build.sh"
    }, {
      "url": "https://github.com/hoxxep/Snarl",
      "path": "~/Documents/Projects/Snarl"
    }
  ]
}
```

- `port`: if left blank will default to 8001.
- `log`: if removed/directory is left blank will default to the running directory. Note: directory must already exist
 or an error will be thrown.
- `repository`: any repository options/properties which have been left out default to the following:

```JSON
{
  "url": "https://github.com/hoxxep/Gookie",
  "path": "~/Documents/Projects/Gookie",
  "deploy": "git pull",
  "secret": ""
}
```

This means if you don't have a custom `deploy` script/command, it will default to `git pull`, and the secret will default to blank.

Sample Output
-------------

Sample output which Gookie outputs to terminal window after the following actions:

1. Visited machine URL in browser.
2. Pushed to repo [hoxxep/Snarl](https://github.com/hoxxep/Snarl)
    - This then triggers the `cd "directory" && deploy` command
    - Which then shows the output of `git pull`

```shell
 [02:33:02] Server started on port 8001
 [02:35:08] GET request sent from 1.2.3.4
 [02:33:15] user hoxxep pushed to https://github.com/hoxxep/Snarl
 [02:33:15] cd "/Users/liam/Documents/Projects/Snarl" && git pull
Already up-to-date.

 [02:33:16] end of deploy output
```

TODOs
-----

- Include support for multiple webhooks on the same repo and different actions for each
    - Would require unique urls for each hook/event as GitHub doesn't send what the event was in the payload. Will need to look at a neat way to do this in Express.js
- Add support for repo/webhook secret
- Daemon/service mode? (User can currently work around using the npm module `forever` which is cleaner).

---

Created by Liam Gray (@hoxxep). Released under the MIT License.