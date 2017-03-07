*change logging params
*rearrange initializations - let > const
*add notification models per collection
*add alarmdefs model
*split out security model
rename holiday collection or calendar model
*fix activitylogs calls
*make utility collections dynamic

*models extend common and common extends utility
    add logger.info to common

split out model functionality (Point -> System -> Point)

add default log text to Activity Logs enumset
move all requires to bottom and new () to inside methods (models, controllers, and sockets)
