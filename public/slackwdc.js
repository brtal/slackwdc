"use strict";

(function() {
    var myConnector = tableau.makeConnector();

    myConnector.init = function(initCallback){
        console.log("Initializing Web Data Connector. Phase is " + tableau.phase);

        var access_token = getHashParams("access_token");

        if (!tableau.password && !access_token) {
            console.log("We do not have access tokens available");
            if (tableau.phase != tableau.phaseEnum.gatherDataPhase) {
                toggleUIState('signIn');
                var redirectToSignIn = function() {
                    window.location.href = "/auth";
                };
                $("#signInButton").click(redirectToSignIn);
            } else {
                tableau.abortForAuth("Missing Slack access token!");
            }

            // Early return here to avoid changing any other state
            return;
        }

        console.log("Access token found!");
        if (access_token)
            tableau.password = access_token;

        toggleUIState('content');

        initCallback();

        if (tableau.phase === tableau.phaseEnum.authPhase) {
            // Immediately submit if we are running in the auth phase
            tableau.submit();
        }
    };

    myConnector.getSchema = function(schemaCallback) {
        console.log("getSchema called. Making request to ./schema");
        $.getJSON( "./schema" )
        .done(function(scehma_json) {
            console.log("call to get schema finished");
            schemaCallback(scehma_json.tables, scehma_json.standardConnections);
        })
        .fail(function(jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.log("Request Failed: " + err);
            tableau.abortWithError(err);
        });
    }

    myConnector.getChannelData = function(table, callback, cursor)
    {
        var connectionUri = "https://slack.com/api/conversations.list?exclude_archived=true&token=" + tableau.password;
        if (cursor)
            connectionUri = connectionUri + "&cursor=" + cursor;

        var that = this;

        $.ajax({
            url: connectionUri,
            dataType: 'json',
            success: function (data) {
                if (data.ok) {
                    var channels = data.channels;
                    var rows = [];

                    for (var i = 0; i < channels.length; ++i)
                    {
                        var c = channels[i];

                        // flatten topic
                        c.topic_value = c.topic.value;
                        c.topic_creator = c.topic.creator;
                        c.topic_lastset = c.topic.last_set;
                        delete c.topic;

                        // flat purpose
                        c.purpose_value = c.purpose.value;
                        c.purpose_creator = c.purpose.creator;
                        c.purpose_lastset = c.purpose.last_set;
                        delete c.purpose;

                        // delete other stuff we don't want here
                        delete c.previous_names;

                        c.created = makeDate(c.created);
                        c.topic_lastset = makeDate(c.topic_lastset);
                        c.purpose_lastset = makeDate(c.purpose_lastset);

                        rows.push(c);
                    }

                    table.appendRows(rows);

                    if (data.response_metadata && data.response_metadata.next_cursor && data.response_metadata.next_cursor.length > 0)
                    {
                        that.getChannelData(table, callback, data.response_metadata.next_cursor);
                    }
                    else
                    {
                        callback();
                    }
                }
                else {
                    if (data.error == "invalid_auth")
                        tableau.abortForAuth("Invalid token");
                    else
                        tableau.abortWithError("Slack API error: " + data.error);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                tableau.abortWithError("HTTP error: " + thrownError);
            }
        });
    }

    myConnector.getMemberData = function(table, callback, cursor)
    {
        var connectionUri = "https://slack.com/api/users.list?token=" + tableau.password;
        if (cursor)
            connectionUri = connectionUri + "&cursor=" + cursor;

        var that = this;

        $.ajax({
            url: connectionUri,
            dataType: 'json',
            success: function (data) {
                if (data.ok) {
                    var members = data.members;
                    var rows = [];

                    for (var i = 0; i < members.length; ++i)
                    {
                        var m = members[i];

                        m.updated = makeDate(m.updated);

                        // flatten profile
                        m.real_name_normalized = m.profile.real_name_normalized;
                        m.email = m.profile.email;
                        delete m.profile;

                        rows.push(m);
                    }

                    table.appendRows(rows);

                    if (data.response_metadata && data.response_metadata.next_cursor && data.response_metadata.next_cursor.length > 0)
                    {
                        that.getMemberData(table, callback, data.response_metadata.next_cursor);
                    }
                    else
                    {
                        callback();
                    }
                }
                else {
                    if (data.error == "invalid_auth")
                        tableau.abortForAuth("Invalid token");
                    else
                        tableau.abortWithError("Slack API error: " + data.error);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                tableau.abortWithError("HTTP error: " + thrownError);
            }
        });
    }

    // This function acutally make the foursquare API call and
    // parses the results and passes them back to Tableau
    myConnector.getData = function(table, doneCallback) {
        if (table.tableInfo.id == "Channels")
        {
            this.getChannelData(table, doneCallback, null);
        }
        else if (table.tableInfo.id == "Members")
        {
            this.getMemberData(table, doneCallback, null);
        }
    };


    tableau.registerConnector(myConnector);


    //-------------------------------Connector UI---------------------------//

    $(document).ready(function() {  
        $("#getdata").click(function() { // This event fires when a button is clicked
            setupConnector();
        });
    });

    function makeDate(epoch) {
        if (!epoch || epoch == 0)
            return null;
        var d = new Date(0);
        d.setUTCSeconds(epoch);
        return d.toISOString();
    }

    function getHashParams(name) {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        while (e = r.exec(q)) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams[name];
    }

    function setupConnector() {
        tableau.connectionName = "Slack Channels";
        tableau.authType = tableau.authTypeEnum.custom;
        tableau.submit();
    };
    
    function toggleUIState(contentToShow) {
        var allIds = [
            '#defaultContent',
            '#content',
            '#signIn'
        ];

        for(var i in allIds) {
            $(allIds[i]).css('display', 'none');
        }

        $('#' + contentToShow).css('display', 'inline-block');
    }
})();
