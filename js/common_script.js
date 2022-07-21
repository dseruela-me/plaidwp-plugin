// Generate link token
function createLinkToken() {
    jQuery.ajax({
        async: false,
        type: 'POST',
        url: plaidwpscriptsajax.ajaxurl,
        data: {
            action: 'plaidwp_ajaxhandler',
            nonce: plaidwpscriptsajax.nonce,
            process: 'create_plaid_link_token',
        },
        success: function(data, textStatus, XMLHttpRequest) {
            var tmp = JSON.parse(data);

            if( tmp.error_code ) {
                console.log('Error: ' + tmp.error_code);
                console.log('Error: ' + tmp.error_message);
            } else {
                console.log('Status: ' + textStatus + ' - Link token created.');
                localStorage.setItem("linkTokenData", data);
            }
        },
        error: function() {
            console.log('Error');
        }
    });
}

// Get access token
function getAccessToken(public_token, metadata) {
    jQuery.ajax({
        'async': false,
        'type': 'POST',
        'url': plaidwpscriptsajax.ajaxurl,
        'data': { 
            action: 'plaidwp_ajaxhandler',
            nonce: plaidwpscriptsajax.nonce,
            process: 'process_plaid_token',
            public_token: public_token,
            metadata: metadata,
            customer_id: 'customer-unique-id',
            },
        'success': function(data, textStatus, XMLHttpRequest) {
            console.log('Status: ' + textStatus + ' - Access token created.');
            localStorage.setItem("accessTokenData", data);
        }
    });
}

function checkConnectedStatus() {
    // check if access_token is available.
    if(localStorage.getItem("accessTokenData") !== null) {
        try {
            var storedAccessTokenData = localStorage.getItem("accessTokenData");
            var accessTokenData = JSON.parse(storedAccessTokenData);
    
            if(accessTokenData.access_token !== null) {
                jQuery("#connectedUI").removeClass("d-none");
                jQuery("#connectedUI").addClass("d-block");
                jQuery("#output").removeClass("d-none");
                jQuery("#bankName").text( localStorage.getItem("institutionName") );

                jQuery("#disconnectedUI").addClass("d-none");
                jQuery("#disconnectedUI").removeClass("d-block");

                // Display account balance.
                getAccountsBalance();
            } 
        } catch (error) {
            console.log(`We encountered an error: ${error}`);
        }
    } else {
        jQuery("#disconnectedUI").removeClass("d-none");
        jQuery("#disconnectedUI").addClass("d-block");

        jQuery("#connectedUI").addClass("d-none");
        jQuery("#connectedUI").removeClass("d-block");
        jQuery("#output").addClass("d-none");
        console.log("Please connect to your bank!");
    }
    
}

function disconnectBank() {
    localStorage.clear();
    jQuery('#connectedUI').removeClass('d-block');
    jQuery('#connectedUI').addClass('d-none').hide();
    jQuery('#output').addClass('d-none').hide();

    console.log('Bank disconnected.');
    //alert('Bank disconnected.');

    setTimeout(function(){
        location.reload(1);
    }, 3000);
}

// Get accounts balance.
function getAccountsBalance() {
    var storedAccessTokenData = localStorage.getItem("accessTokenData");
    var accessTokenData = JSON.parse(storedAccessTokenData);

    jQuery.ajax({
        'async': false,
        'type': 'POST',
        'url': plaidwpscriptsajax.ajaxurl,
        'data': { 
            action: 'plaidwp_ajaxhandler',
            nonce: plaidwpscriptsajax.nonce,
            process: 'get_accounts_balance',
            access_token: accessTokenData.access_token,
            },
        'success': function(data) {
            // https://plaid.com/docs/api/products/balance/#accountsbalanceget
            // loop through the object and look for type="depository"

            // Clear view before displaying data.
            jQuery('#output #assets').children().remove();
            jQuery('#output #liabilities').children().remove();

            var tmp = JSON.parse(data);
            // jQuery("#output-json").append(data);
            jQuery('#output').removeClass('d-none');

            if( tmp.error_code ) {
                console.log('Error: ' + tmp.error_code);
                console.log('Error: ' + tmp.error_message);
                alert('Error: ' + tmp.error_code + ' - ' + tmp.error_message);
            } else {
                var numAssets = [];
                var numLiabilities = [];

                for (let i = 0; i < tmp.accounts.length; i++) {
                    var type = tmp.accounts[i].type.charAt(0).toUpperCase() + tmp.accounts[i].type.slice(1);
                    var avail_bal = (tmp.accounts[i].balances.available) == null ? 0 : tmp.accounts[i].balances.available; 
                    var current_bal = (tmp.accounts[i].balances.current) == null ? 0 : tmp.accounts[i].balances.current; 
                    var acctName = tmp.accounts[i].name;
                    var currency = (tmp.accounts[i].balances.iso_currency_code == "USD") ? "$" : "";
    
                    if( type == "Depository" || type == "Investment" ) {
                        numAssets.push(current_bal);
                        jQuery('#output #assets').append('<div class="row py-2 data-item"><div class="col-sm-8"><b>' + type + ':</b> ' + acctName + '</div><div class="col-sm-4">' + currency + custom_number_format(current_bal, 2, '.', ',') + '</div></div>');
    
                        console.log(type + '(available): ' + acctName + ' - ' + currency + avail_bal);
                        console.log(type + '(current): ' + acctName + ' - ' + currency + current_bal);
                    } else if( type == "Credit" || type == "Loan" ) {
                        numLiabilities.push(current_bal);
                        jQuery('#output #liabilities').append('<div class="row py-2 data-item"><div class="col-sm-8"><b>' + type + ':</b> ' + acctName + '</div><div class="col-sm-4">' + currency + custom_number_format(current_bal, 2, '.', ',') + '</div></div>');
    
                        console.log(type + '(available): ' + acctName + ' - ' + currency + avail_bal);
                        console.log(type + '(current): ' + acctName + ' - ' + currency + current_bal);
                    }
                    
                }

                // Get Totals
                var totalAssets = getTotal(numAssets);
                var totalLiabilities = getTotal(numLiabilities);

                // Display Totals
                jQuery('#output #netAmount').text( currency + custom_number_format((totalAssets - totalLiabilities), 2, '.', ', ') );
                jQuery('#output #assets').prepend('<div class="col-sm-12"><h3 class="totalBal">' + currency + custom_number_format(totalAssets, 2, '.', ', ') + '</h3><h3 class="coa-type py-4">Assets</h3></div>');
                jQuery('#output #liabilities').prepend('<div class="col-sm-12"><h3 class="totalBal">' + currency + custom_number_format(totalLiabilities, 2, '.', ', ') + '</h3><h3 class="coa-type py-4">Liabilities</h3></div>');
            
                console.log('Total Assets:' + totalAssets);
                console.log('Total Liabilities:' + totalLiabilities);
                console.log('Total Net Amount:' + (totalAssets - totalLiabilities) );
                console.log('Total Accounts: ' + tmp.accounts.length);
                
                getBankName(tmp.item.institution_id);
            }
            
        },
        'error': function() {
            console.log('Invalid API keys used.');
        }
    });
}

function getBankName(institution) {
    // Clear view before displaying data.
    jQuery('#output #bankLinked').children().remove();

    jQuery.ajax({
        'async': false,
        'type': 'POST',
        'url': plaidwpscriptsajax.ajaxurl,
        'data': {
            action: 'plaidwp_ajaxhandler',
            nonce: plaidwpscriptsajax.nonce,
            process: 'get_bank_name',
            institution_id: institution,
        },
        'success': function(data) {
            var tmp = JSON.parse(data);

            console.log('Bank code: ' + tmp.institution.institution_id);
            console.log('Bank name: ' + tmp.institution.name);
            jQuery('#output #bankLinked').append('<h1>Bank Linked</h1>' +
                                        '<div class="bankName alert alert-secondary alert-dismissible fade show" role="alert">' + 
                                        tmp.institution.name + 
                                        '<button type="button" id="disconnectBank" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                                        '</div>');
        }
    });
}

function getTotal(num) {
    var sum = num.reduce((accumulator, object) => {
        return accumulator + object;
    }, 0);

    return sum;
}

function custom_number_format( number_input, decimals, dec_point, thousands_sep ) {
    var number       = ( number_input + '' ).replace( /[^0-9+\-Ee.]/g, '' );
    var finite_number   = !isFinite( +number ) ? 0 : +number;
    var finite_decimals = !isFinite( +decimals ) ? 0 : Math.abs( decimals );
    var seperater     = ( typeof thousands_sep === 'undefined' ) ? ',' : thousands_sep;
    var decimal_pont   = ( typeof dec_point === 'undefined' ) ? '.' : dec_point;
    var number_output   = '';
    var toFixedFix = function ( n, prec ) {
      if( ( '' + n ).indexOf( 'e' ) === -1 ) {
        return +( Math.round( n + 'e+' + prec ) + 'e-' + prec );
        } else {
        var arr = ( '' + n ).split( 'e' );
        let sig = '';
        if ( +arr[1] + prec > 0 ) {
          sig = '+';
        }
        return ( +(Math.round( +arr[0] + 'e' + sig + ( +arr[1] + prec ) ) + 'e-' + prec ) ).toFixed( prec );
      }
    }
    number_output = ( finite_decimals ? toFixedFix( finite_number, finite_decimals ).toString() : '' + Math.round( finite_number ) ).split( '.' );
    
    if( number_output[0].length > 3 ) {
      number_output[0] = number_output[0].replace( /\B(?=(?:\d{3})+(?!\d))/g, seperater );
    }
    if( ( number_output[1] || '' ).length < finite_decimals ) {
      number_output[1] = number_output[1] || '';
      number_output[1] += new Array( finite_decimals - number_output[1].length + 1 ).join( '0' );
    }

    return number_output.join( decimal_pont );
}

jQuery(document).ready(function(){

    checkConnectedStatus();

    createLinkToken();

    var storedTokenData = localStorage.getItem("linkTokenData");
    var linkTokenData = JSON.parse(storedTokenData);
    

    if( linkTokenData.error_code ) {
        console.log('Error: ' + linkTokenData.error_code);
        console.log('Error: ' + linkTokenData.error_message);
    } else {
        console.log(`I retrieved ${linkTokenData.link_token} from local storage`);
        jQuery(function(){
    
            var linkHandler = Plaid.create({  
                        selectAccount: true,
                        env: 'sandbox',
                        apiVersion: 'v2',
                        clientName: 'Taxsurety Test App',
                        //key: linkTokenData.link_token,
                        product: ['transactions'],
                        // product: ['auth', 'transactions', 'identity'],
                        //webhook: 'https://myurl.com/webhooks/p_responses.php',
                        token: linkTokenData.link_token,
                        //receivedRedirectUri: window.location.href,
                        onLoad: function() {
                            // Optional, called when Link loads
                        },
                        onSuccess: function(public_token, metadata, customer_id) {  
                            // Send the public_token to your app server.
                            // The metadata object contains info about the institution the
                            // user selected and the account ID or IDs, if the
                            // Account Select view is enabled.   
                            getAccessToken(public_token, metadata);
                            var storedAccessTokenData = localStorage.getItem("accessTokenData");
                            var accessTokenData = JSON.parse(storedAccessTokenData);
    
                            localStorage.setItem("institutionName", metadata.institution.name);
                            
                            console.log(`Access Token: ${accessTokenData.access_token} from local storage`);
                            // window.location.href = "http://localhost/taxsuretytest/plaid-wp/";
                            // Check connected status.
                            checkConnectedStatus();
    
                            console.log('Metadata institution: ' + metadata.institution.name);
                            console.log('Metadata institution_id: ' + metadata.institution.institution_id);
                            console.log('Metadata account_id: ' + metadata.account_id);
                            // console.log('Metadata item_id: ' + metadata.item_id);
                            // console.log('Customer Id: ' + customer_id);
                        },
                        onExit: function(err, metadata) {
                            // The user exited the Link flow.
                            if (err != null) {
                                // The user encountered a Plaid API error prior to exiting.
                            }
                            // metadata contains information about the institution
                            // that the user selected and the most recent API request IDs.
                            // Storing this information can be helpful for support.
                        },
            });
            
            // Trigger the standard Institution Select view 
            jQuery('#linkButton').on('click', function(e){
                linkHandler.open();
            });
    
            // Trigger the Account Balance View
            jQuery("#getAccounts").on("click", function(){
                getAccountsBalance();
            });

            // Trigger if there are changes to the DOM after successful plaid connection.
            jQuery('#output').bind('DOMSubtreeModified', function(){
                jQuery('#disconnectBank').on('click', function(){
                    disconnectBank();
                });
            });

            // Trigger disconnect bank linked.
            jQuery('#disconnectBank').on('click', function(){
                disconnectBank();
            });
            

        });
    }
});
