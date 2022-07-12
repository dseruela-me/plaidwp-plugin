<?php
/**
 * Display plaid wordpress settings for API keys.
 * 
 */

global $wpdb;

$current_url = home_url(add_query_arg(array(), $wpdb->request));

$tbl_name = $wpdb->prefix . 'plaidwp_config';  
$result = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $tbl_name WHERE id = %d", 99 ) );

$client_id      = !empty($result->client_id) ? $result->client_id : "";
$client_secret  = !empty($result->client_secret) ? $result->client_secret : "";
$plaid_url      = !empty($result->plaid_url) ? $result->plaid_url : "";
$callback_url   = !empty($result->callback_url) ? $result->callback_url : "";
?>

<div class="container">
    <hr>   
    <div class="well text-center">
        <h1>Plaid WordPress Settings</h1>
        <p>Pull-out financial data through plaid for tax calculation.</p>
        <p>Use the following shortcode below to page or post.</p>
        <pre class="custom-pre">[PLAIDWORDPRESS]</pre>
   <br>
   </div>

    <div class="col-half">
      <form action="<?php $current_url  ?>" method="POST">
         <table width="100%">
            <tr>
               <td style="width: 30%;"><label for="client_id">Cliend ID:</label></td>
               <td style="width: 70%;"><input style="width: 100%;" type="text" id="client_id" name="client_id" value="<?php echo $client_id; ?>"></td>
            </tr>
            <tr>
               <td style="width: 30%;"><label for="client_secret">Client Secret:</label></td>
               <td style="width: 70%;"><input style="width: 100%;" type="text" id="client_secret" name="client_secret" value="<?php echo $client_secret; ?>"></td>
            </tr>
            <tr>
               <td style="width: 30%;"><label for="plaid_url">Plaid URL:</label></td>
               <td style="width: 70%;"><input style="width: 100%;" type="text" id="plaid_url" name="plaid_url" value="<?php echo $plaid_url; ?>"></td>
            </tr>
            <tr>
               <td style="width: 30%;"><label for="callback_url">Callback URL:</label></td>
               <td style="width: 70%;"><input style="width: 100%;" type="text" id="callback_url" name="callback_url" value="<?php echo $callback_url; ?>"></td>
            </tr>
            <tr>
               <td colspan="2" style="text-align: right"><input id="save_plaid_config" name="save_plaid_config" class="btn btn-success" type="submit" value="Save Configuration"></td>
            </tr>
         </table>
      </form>
   </div>
</div>