---
title: "How to make Authentik Proxy Provider work with Immich, including the Immich Mobile App"
date: "2025-08-02"
tags: ["homelab", "guide"]
---

## Background
If you're exposing your Immich instance to the web, ideally it is protected behind an authentication proxy like Authentik. Technically it's easier to 'just' expose Immich directly and just use Authentik as an OAuth provider but you are exposed to vulnerabilities in Immich which can be exploited without the user being logged in. Ideally everything should pass through Authentik first.

So here's what I want to achieve:
1. Someone visits immich.mydomain
1. Authentik intercepts that request and requires the person to log in.
1. Once the person is logged in, they are redirected to Immich
1. They are immediately logged into Immich since they are already authenticated with Authentik
1. Also, this should work with the Mobile App, which is slightly more complicated. I will explain a little further down.

This guide should be generally applicable to most setups with a Reverse Proxy, Authentik, and Immich. In my examples, I will use Caddy as my reverse proxy.

## Steps: Getting Immich OAuth work with Authentik
This is pretty simple: Just follow the [official instructions from Immich](https://immich.app/docs/administration/oauth/).

Note that after you complete this step, you will have the following setup in your reverse proxy:

```
immich.yourdomain {
	handle {
		reverse_proxy <Immich ip address:port> {
		}
	}
}

authentik.yourdomain {
	handle {
		reverse_proxy <Authentik ip address:port> {
		}
	}
}
```

In short, users visiting `immich.yourdomain` will be directly forwarded to Immich. If a malicious attacker can craft a payload targeting `immich.yourdomain/api/sensitive-stuff`, they theoretically could obtain sensitive data. Ideally, all traffic should go through Authentik first.

## Steps: Getting Authentik to proxy requests to Immich.
Authentik provides a 'Proxy Provider' that achieves what we want.

Create an Authentik Proxy Application + Provider by going to:

1. Applications -> 'Create with Provider'
1. Choose 'Proxy Provider'
1. Between 'Proxy', 'Forward Auth (single application)', 'Forward Auth (domain level)', choose 'Proxy'. (Technically Forward Auth should work but I didn't get it working)
1. For 'External host', input `https://immich.yourdomain`
1. For 'Internal host', input your local `<Immich ip address:port>`
1. I have internal host SSL validation off
1. Leave the rest as default and finish up.

Now, update your Caddy config to point `immich.yourdomain` to Authentik. 

```
immich.yourdomain {
	handle {
		reverse_proxy <Authentik ip address:port> {
		}
	}
}

authentik.yourdomain {
	handle {
		reverse_proxy <Authentik ip address:port> {
		}
	}
}
```

Now try accessing `immich.yourdomain` in your browser (ideally in a private window). You will arrive at the Authentik screen asking you to login. Once you've logged in (via OAuth, e.g. Google login), you should be forwarded to Immich and you will automatically be logged in after a few redirects.

So the flow looks something like

1. Access `immich.yourdomain`
1. Authentik Proxy Provider intercepts request and initiates login flow.
1. User authenticates with Authentik Proxy Provider, Authentik forwards request to Immich.
1. Immich initiates OAuth login flow, redirecting to Authentik OAuth Provider
1. User was already authenticated, Authentik OAuth Provider authenticates the request
1. User is now logged into Immich :)

## Steps: Getting Authentik Proxy Provider to work with Immich Mobile App
You will notice that the current setup won't work with the Immich Mobile App. That's because the app doesn't support the initial redirect when Authentik Proxy Provider intercepts the request to initiate the login flow.

To get the Mobile App working, you will need to _pre-authenticate_ the user to Authentik _Proxy Provider_. (Then the user can use the regular login flow to authenticate to Authentik _OAuth Provider_)

A similar setup exists using Cloudflare Tunnels, as described in [this guide](https://www.youtube.com/watch?v=J4vVYFVWu5Q). Instead of using Service Tokens (`CF-Access-Client-Id`, `CF-Access-Client-Secret`), we will use Authentik's Service Account and App Passwords.

Here's how to go about doing it:

1. In Authentik, go to Directory -> Users -> Create Service Account
1. Configure the user however you like.
1. Copy the username and password.
1. Base64 encode the username and password, joined by a colon: `<username>:<password>`. On UNIX systems, you can do: `echo -n '<username>:<password>' | base64`
1. Go to your Immich Mobile app, click the gear Settings icon.
1. Go to Advanced -> Custom proxy headers
1. For Header name, input 'Authorization'
1. For Header value, input 'Basic <base64 encoded username and password>'
1. Now you can log into your Immich Mobile App! You will still need to complete the regular login process for Immich.

Feel free to create a new Service Account for each Immich user that you are administering. So you can revoke a Service Account as needed without impacting all of your users.
