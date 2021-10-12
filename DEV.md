# Actions
Things I do most often:

## Add Game

## Modify Game

## Remove Game


# Current Concerns

* The core loop for adding/modifying games is not great
  * name vs bbg id - name rarely matches meaning I usually have to look the game up in bgg anyway
  * managing list of games is becoming cumbersome (have to search the document for a game)
  * versions suck to add
  * "New games" could be automated
  * Adding new custom fields is going to be difficult
* Image management is lacking
  * No image cleanup
  * No smart rebuild / management
* Need a loop for updating bgg details
* Game names aren't great from bgg

# Wanted Features

* For Sale
* I don't want to deal with "new games"
* Blurhash - known image sizes
* Super filtering (multi select, removing options, ordered by number of items)
* "I'm feeling lucky"
* Load initial page with small game payload (load full payload after)

# Bugs

* Bug with images not loading
  * Chrome?
  * On filter change?


# Backend redesign ideas

No manual file - all cli driven - wizard style

`yarn games`
`actions: add delete modify refresh-all`
