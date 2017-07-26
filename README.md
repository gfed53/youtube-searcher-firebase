# The Swiss Army YouTube Searcher (Google Firebase Version)

## Note

This is the implementation of SaYs that uses Google Firebase instead of the user's localStorage to store saved content. It is still possible to use localStorage instead, as it serves as a fallback if you don't want to provide a database to use.


## Build Instructions

1. Make sure npm is installed, then, inside the terminal, run `npm i` to install all dependencies.

2. Before you start using the app, you will need to supply the app with a few API keys.

  * Navigate to config.js.

  * You should find the places where the API keys are needed, as well as a Google Firebase database (fBaseDB) if you choose to utilize one.

  * Your Google API (googKey) key is required, and it must have YouTube Data and Google Maps enabled for use. The Yandex Translate API (translateKey) key isn't required, however (but don't try altering the translate search options if you don't have the key supplied!).

 3. Once all dependencies are installed and everything is in place, you can run `gulp build` in the command line to create a build version.

 4. You can serve the app locally by running `node server`. The app listens at port 8080.

A demo version is currently being created - with no API key insertion required. You can check it out [here](http://youtube-searcher-8972.herokuapp.com/)!



## Introduction

Welcome to the Swiss Army YouTube Searcher! (The name is subject to change, as it has changed once already. Fair warning..) The goal of this app is to allow the user to gain more freedom in searching for YouTube videos. It was originally created with all of the hardcore YouTube junkies out there in mind (myself included), but of course can be enjoyed and used by anybody.

In the future there may be more search options available, so stay tuned, and in the meantime, enjoy!

## Guide

You can simply do a basic video search via the default search bar. Clicking "Toggle Advanced" brings out the advanced search parameters

Currently, you can search by location, result order, safe search settings, date range (from, to), and also by a particular channel filter.

The location parameter uses Google Maps to allow the user to select a portion of the map using an adjustable circular selector. Due to the limits of the API, radii of selections cannot exceed 1000 kilometers. You can clear the selection by clicking the "Clear Selection" button. The coordinates of the center of the circle and its radius are displayed to the left and right of the "Clear Selection" button, respectively.


If you want to search the contents of a specific channel, here's what you do:

First, search for a channel in the "Search Channel" input box
Assuming you get back results, select whichever channel you'd like by clicking on its image.

You should then see the filter applied represented by an icon below the search bar.

You will now only get results from that particular channel back. Clicking on another channel will reset the filter. 

You can remove the filter by clicking the "Clear Filter" button.

The translate feature is the newest addition to the app. You can set a language, and before search execution, the API will translate the keywords (you will also see it in the search bar, allowing you to make tweaks if you wanted to get different results).

You can also click the "Save Search" button to save and store the current search parameters as an item in your local storage. You can find all of your saved past searches in the "Personal" view. In the "Saved Searches" area of this view, clicking the "Grab!" button will activate the respective saved search and fill the current parameters. Note that this doesn't immediately initialize the search, so you can tweak any of the parameters as you wish before making your search.

## Known Bugs/Issues

It is recommended that you Disconnect from Firebase before changing Firebase databases within the code. If for some reason you forget, you should immediately Disconnect from Firebase since it may cause conflicts with the database you end up switching to.

Map sometimes doesn't expand as it should. Simply refreshing the page should solve this.

Sometimes issues occur when fetching saved searches/videos, and you may not see any of your saved content. Simply refreshing the page should solve this.

This app works best in Google Chrome. I continue to add fixes to any cross-browser issues I may come across.


(This ends the "about" section content)

## The Process

This app uses CORS requests to get data from the Youtube API, and uses the iframe element to allow embedded YouTube videos within the app. Aside from working further with API hacks using AngularJS, in developing this app I was also introduced to AngularUI router, which utilizes nested states and views. This dependency is more than just a better alternative to ngView; it changes the way a website or app's structure is viewed, and promotes a more modular approach.

I also began following John Papa's [Style Guide](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md) for best practices in developing AngularJS projects, as I have with other projects.

This app is powered by the [Youtube Data API](https://developers.google.com/maps/documentation/javascript/), [Google Maps API](https://developers.google.com/maps/documentation/javascript/), [Yandex Translate API](https://tech.yandex.com/translate/), and [Google Firebase](https://console.firebase.google.com/).


## Resources

The src directory contains the source code, while the build version is not currently distributed.

