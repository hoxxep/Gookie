Gookie
======

Small and highly configurable node server for handling your GitHub Webhooks.

Inspired by [GitHub Auto Deploy](https://github.com/logsol/Github-Auto-Deploy) which was written in Python and designed only for pull requests. GitHub Webhook Server is written in Node.js and is just as friendly; outputs deploy script output; and is more configurable. Was designed to solve one or two of the problems we ran into at the [eth0 hackathon](https://github.com/hoxxep/eth0-Hackathon), such as mentioning in the terminal that a ping event occurred and showing errors during git pull/our deploy script.

Getting Started
---------------

1. Download Gookie or clone the repo (`git clone https://github.com/hoxxep/Gookie`).
2. Edit `config.json` by setting the port for your webhook and configuring a repository.
3. Run `npm install` to install local dependencies.
4. Run `node Gookie.js` to start the server.
5. Test your Gookie server is running by visiting your ip:port in a browser.
    - *Troubleshooting:* you may have to open ports if your router/firewall is restricting your chosen port. You can use [ngrok](https://ngrok.com/) as a temporary solution.
6. Configure your [webhook](https://developer.github.com/webhooks/) by visiting your repo settings on GitHub.
    - Enter the url of your machine and the port, and specify content type as application/json.

Configuration
-------------

Example `config.json`:

```JSON
{
  "port": 8001,
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

If left blank, the `port` will default to 8001; and any repository options/properties which have been left out default to the following:

```JSON
{
  "url": "https://github.com/hoxxep/Gookie",
  "path": "~/Documents/Projects/Gookie",
  "deploy": "git pull",
  "secret": ""
}
```

This means if you don't have a custom `deploy` script/command, it will default to `git pull`, and the secret will default to blank.

TODOs
-----

- Include support for multiple webhooks on the same repo and different actions for each
- Quiet mode
- Add a custom terminal message for ping event
- Stop server sending errors to client
- Add support for repo/webhook secret
- Better parsing of github url (currently must have 'https://', no trailing slash and no www)

---

Created by Liam Gray (@hoxxep).
Released under the MIT License.
