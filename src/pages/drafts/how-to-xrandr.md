---
title: "How To Fix Fractional Scaling In Linux - How To Be Good At xrandr"
date: "2020-05-25"
---

***Note***: This is not really *linux* per se, but rather, any DE that uses xrandr. Thus, this is less applicable to Wayland. My experience also mostly revolves around GNOME, and this will cover things that are specific to GNOME as well.

# TLDR
If you have a dual 4k monitor and have a screen rotated to portrait mode, and want a fractional scaling of 1.5, this script may be useful to you:

```bash
gsettings set org.gnome.desktop.interface scaling-factor 2
gsettings set org.gnome.settings-daemon.plugins.xsettings overrides "{'Gdk/WindowScalingFactor': <2>}"

xrandr \
  --output DP-4-OR-WHATEVER-DISPLAY-DEVICE --primary --mode 3840x2160 --fb 9000x5760 --rotate normal  --scale 1.5x1.5 --panning 5760x3240+0+0 \
  --output DP-0-OR-WHATEVER-DISPLAY-DEVICE --mode 3840x2160 --fb 9000x5760 --right-of DP-4 --scale 1.5x1.5 --panning 3240x5760+5760+0 --rotate right
```

# Background
GNOME 3.32 (Since Ubuntu 19.04) introduced fractional scaling. I have been happily using it but it broke in Ubuntu 20.04 for NVIDIA cards and [a fix is not in the horizon](https://bugs.launchpad.net/ubuntu/+source/mutter/+bug/1873403). (What's new, really...)

So, let's go back to how we do fractional scaling pre-3.32: via xrandr scaling hacks. I believe the implementation of fractional scaling in GNOME 3.32 uses a similar technique, but I've not followed the development closely to say for sure.

Scaling calculation is a bit tricky because we have to deal with GNOME scaling + xrandr scaling.

# Main Idea
1. We scale everything to 200% in GNOME.
2. We then up-res everything to 200% of the PERCEIVED resolution that we want (more on that later)
3. We then scale everything back down to the PHYSICAL resolution of our monitors, this time via xrandr.

This is actually a pretty common approach. [Apple does a similar strategy](https://medium.com/elementaryos/top-3-misconceptions-about-hidpi-f5ef493d7bf8).

Note that we're optimizing for display quality here, this might be a problem if your hardware is not powerful enough. You might need to tweak the calculations to avoid integer scaling of 200%.

## Terminology - or how to think about stuff
I like to categorize resolutions to 3 types:

1. Physical Resolution
  This is the actual resolution of your monitor.
1. Virtual Resolution
  This is the resolution that your graphics card/OS actually renders. For example, you can render with a virtual resolution of `3840x2160` (4k) and display it onto your monitor with only `1920x1080` (physical resolution) pixels. Or vice versa.
1. Perceived Resolution
  This is the trickiest one. I sometimes like to think of this as IMAGINARY resolution. This is the resolution that you ***perceive*** given how the size of the UI looks to you.\
  \
  For example, if you have a `3840x2160` monitor and you are also rendering at `3840x2160` (physical resolution == virtual resolution), and you set a scaling factor of 2, the UI will look 2x bigger. More importantly, the size of the UI **will be the same as on a 1920x1080 monitor rendering at 1920x1080**. In other words, on a `3840x2160` monitor with a scaling factor of 2, the ***perceived resolution*** is `1920x1080`.

Now, let's move on to explanations for each step.


## 1 - Scale Everything to 200% in GNOME.
The important point in here is that we scale everything just to the step where things look too large. If 200% is still too small, you'll need to scale to 300% etc and adjust accordingly.

After doing this, our resolutions are:\
Physical:  `3840x2160` (never changes)\
Virtual :  `3840x2160`\
Perceived: **`1920x1080`**

## 2 - Calculate our desired perceived resolution, up-res it 2x to get our virtual resolution
1920x1080 is too low of a resolution (remember, we're working with perceived resolution here). So think, with your monitor size, what *native* resolution will look good on it? For example, 2560x1440 is a popular choice for 27" monitor.

Well, `2560 / 1920 = 1.333...`

This ratio is not very clean. Let's settle for a ratio of 1.5. Thus, `1920 * 1.5 = 2880` and `1080 * 1.5  = 1620`. (Note: If you have a GNOME scaling factor of 2, this calculation is enough. But if you have a different scale factor, then you'll need to make sure the factor you choose can 'scale back' to the physical resolution, [see below]). <TODO: Try with a different scale factor, like 1.3>

Our goal now is to make our monitor look like it has a resolution of `2880x1620` (i.e. perceived resolution), but with the *fidelity* and *crispness* of a 4k display. To preserve the crispness, we will increase the number of pixels (in each direction) we render by 2x, i.e. `5760x3240`

Thus, our calculated resolutions should be:\
Physical:  `3840x2160` (never changes)\
Virtual :  **`5760x3240`**\
Perceived: **`2880x1620`**

*\*\*Small Note:\*\** This means that even though we're only using a 4k monitor, we're actually rendering more resolution than if we had a 5k (`5120x2880`) monitor at 2x scaling! It's advantageous to have a monitor where its resolution is just doubled (per-side) of its usual (non-scaled) comfortable native resolution for you.\
e.g. if `2560x1440` without scaling looks good on a 27" monitor for you, the best 'high dpi' resolution will be `5120x2880`. If `1920x1080` looks good on a 24" monitor for you, then `3840x2160` (4k) is the best.\
In this case, it also means we don't have to spend computer resources to scale the resolution back down to the physical resolution.


## 3 - Scale Everything Back to The Physical Resolution
To set the `--scale` property in `xrandr` correctly, we need to figure out how to scale our **virtual** resolution back into our **physical** resolution. Since we've already done our math above, it's just a matter of dividing: `virtual / physical`. e.g. `5760 / 3840 = 1.5`

Thus, our scale factor is `1.5`. In fact, if we chose a GNOME scaling factor of 2, then our scale factor will always be the same as the ratio we chose above because... math.

```rust
let gnome_scale_factor = 2; // This may change, depending on user.
let up_res_factor = 2; // This is constant. 2x is almost always enough for crisp images.


let virtual_res =  (physical_res / gnome_scale_factor) * scale_ratio  * up_res_factor;
let xrandr_scale_factor = virtual_res / physical_res;

assert_eq!(virtual_res, physical_res * scale_ratio);
assert_eq!(virtual_res / physical_res, scale_ratio);
assert_eq!(xrandr_scale_factor, scale_ratio);
```

We can't count on it if we have a different scaling factor though.

Note that `xrandr`'s concept of 'scale' is inverse of GNOME's concept of scale! `xrandr` scales ***resolution*** **down** (e.g. `5760 / 1.5 = 3840`) while GNOME scales ***UI elements*** **up** (i.e. icons will look 2x bigger). It may be tempting to think of GNOME scaling as scaling the resolution down, e.g. `3840 / 2 = 1920`, but as we've seen in the previous section, it's not true because the virtual resolution did not change!

So let's put things together in the `xrandr` command now.

## Putting Everything In An `xrandr` Command - Single Display
Let's look at the single display case: \
(Note that a lot of these arguments are not necessary in the single display case, as `--auto` can infer the correct value for you. You just need to supply `--output` and `--scale`)

```
xrandr \
  --output DP-4-OR-WHATEVER-DISPLAY-DEVICE \
  --primary \
  --rotate normal \
  --mode 3840x2160 \
  --fb 5760x3240   \
  --scale 1.5x1.5 \
  --panning 5760x3240+0+0 \
```

`--output`: The device id of your monitor, you can get them by looking at the output of `xrandr -q`\
`--primary`: Set this as your primary display, redundant for single display.\
`--rotate normal`: Set your display's rotation. Normal in this case. You can do `left` `right` etc.\
`--mode`: This is the **physical resolution** of your display.\
`--fb`: This is the **virtual resolution** we have talked about.\
`--scale`: This is the denominator needed to bring the virtual resolution down to the physical resolution, as explained earlier.\
`--panning`: For a single display, this is usually redundant. This is the virtual resolution 'taken up' by the display, plus any shift needed (starting from the top-left).


## Putting Everything In An `xrandr` Command - Multiple Display
This is where things get interesting.

```
xrandr \
  --output DP-4-OR-WHATEVER-DISPLAY-DEVICE \
  --primary \
  --mode 3840x2160 \
  --fb 9000x5760 \
  --rotate normal \
  --scale 1.5x1.5 \
  --panning 5760x3240+0+0 \
\
  --output DP-4-OR-WHATEVER-DISPLAY-DEVICE \
  --rotate right \
  --mode 3840x2160 \
  --right-of DP-4-OR-WHATEVER-DISPLAY-DEVICE \
  --fb 9000x5760   \
  --scale 1.5x1.5 \
  --panning 3240x5760+5760+0 \
```

Now we have 2 displays, 1 primary and another secondary on the right. Let's look at the interesting new arguments:

First, the physical arrangement of the display:\
`--rotate right`: Self-explanatory, it's a display in portrait mode, rotated right.\
`--right-of DP-4-OR-WHATEVER-DISPLAY-DEVICE`: This display is to the right of the other monitor.

Here's how it looks like:
```
 ---------------  -------
 |  Display 1  |  |  2  |
 |             |  |     |
 ---------------  |     |
                  |     |
                  -------
```

`--fb 9000x5760`: This is a little interesting, it's actually the **virtual resolution of both displays combined**, in a rectangle.\
Since the horizontal virtual resolution of Display 1 is 5760, and the horizontal virtual resolution of Display 2 is 3240, thus the total horizontal resolution is `5760 + 3240 = 9000`.\
For the vertical resolution, it is bounded by Display 2's vertical resolution of `5760`.\
\
Note that we set the same `fb` value for both displays. Note also that this value highly depends on how you arrange your monitors.

`--panning`: In Display 2's case, we need to ***shift*** our display rightward, by the number of horizontal virtual pixels of Display 1, `5760` in this case. Note this also depends on how you arrange your monitors.
