# Media Composer helpers

These are some tools I've created to process metadata from Avid Media Composer timelines.

## Timeline Clip Notes Sum

This tool reads a list of Timeline Clip Notes exported from Media Composer. It lists them in a human-readable format and also sums up the duration of clips with the same clip name.
This can be used for music reporting.

## Notes to markers

This tool reads loosly structured timecode notes like below and outputs them in a format that can be pasted as Markers in Media Composer.

```
12'33 Shorten clip
2.12:  Add location graphics
1:00:22 Music louder
```

Note: Pasting markers into Media Composer seems to be broken in MC 2024.12 on windows.

## Usage

Download the html file you need and launch it in a browser.
All processing is done locally on your computer so no internet connection is needed after downloading.
