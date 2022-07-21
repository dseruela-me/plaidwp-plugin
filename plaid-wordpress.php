<?php
/*
    Plugin Name: Plaid WordPress
    Plugin URI: http://#
    description: a plugin for pulling out financial data through plaid for tax calculation.
    Version: 1.0
    Author: Dan Laurice Seruela
    Author URI: http://#
    License: GPL2
*/

define('PLAIDWORDPRESSURL', WP_PLUGIN_URL.'/'.dirname( plugin_basename( __FILE__ ) ) );

// Save config to database.
function save_plaidwp_config( $user_id ) {

    // Create array data
    $data = array(
        'client_id'       => $_POST['client_id'],
        'client_secret'   => $_POST['client_secret'],
        'plaid_url'       => $_POST['plaid_url'],
        'callback_url'    => $_POST['callback_url'],
        'user'            => $user_id,
        'date_created'    => date("Y-m-d h:i:s"),
    );

    
    if( empty( get_option('plaidwp_settings') ) ) {
        // Save to wp_options
        add_option('plaidwp_settings', $data, NULL, 'no');
        echo "<script>alert('Configuration successfully added!');</script>";
    } else {
        // Update to wp_options
        update_option('plaidwp_settings', $data);
        echo "<script>alert('Configuration successfully updated!');</script>";
    }
 }

// Get current user_id to save info to custom plaid table.
function plaidwp_get_your_current_user_id() {
   $wp_current_user_id = get_current_user_id();

   // Clicked save configuration
   if( isset($_POST['save_plaid_config']) ) {
      save_plaidwp_config( $wp_current_user_id );
   }
}
add_action('init', 'plaidwp_get_your_current_user_id');

// Create menu for this plugin on admin page.
function plaidwp_menu() {
    add_menu_page( 
        'Plaid WordPress', 
        'Plaid WordPress', 
        'edit_posts', 
        'init-plaid-settings', 
        'initiate_plaid_settings', 
        'dashicons-bank' 
        );
}

// Plaid settings index page.
function initiate_plaid_settings() {
    include( plugin_dir_path( __FILE__ ) . 'settings.php' );
}
add_action( 'admin_menu', 'plaidwp_menu' );

// Plaid wordpress custom shortcode to be used on posts or pages.
function plaidwp_custom_shortcode() {

    // Display main page
    $displayText .= '<div id="display-wrapper" class="container mt-5 text-center">';
    $displayText .= '<button type="button" id="linkButton" class="btn btn-primary">Connect to your bank</button>';
    $displayText .= '</div>';
    $displayText .= '<div id="connectedUI" class="d-none my-5">';
            $displayText .= '<div class="introtext-wrapper text-center">';
                $displayText .= '<span id="connectDetails">Hi there! You\'re now connected to <span id="bankName"></span>.</span>';
            $displayText .= '</div>';
            $displayText .= '<samp id="output-json" class="my-5 text-center" style="font-size: 11px;"></samp>';
            $displayText .= '<div id="output" class="m-5 d-none row">';
                $displayText .= '<div id="net" class="col-sm-12">';
                    $displayText .= '<h1>Business/Personal Net Worth Statement</h1>';
                    $displayText .= '<h4>A summary of your assets and liabilities</h4>';
                    $displayText .= '<h1 id="netAmount" class="my-5"></h1>';
                $displayText .= '</div>';
                $displayText .= '<div id="assets" class="col-sm-6"></div>';
                $displayText .= '<div id="liabilities" class="col-sm-6"></div>';
                $displayText .= '<div id="bankLinked" class="col-sm-12 my-5">';
                $displayText .= '</div>';
            $displayText .= '</div>';
        $displayText .= '</div>';
    $displayText .= '<div id="disconnectedUI" class="d-none my-5">';
            $displayText .= '<div class="introtext-wrapper text-center">';
                $displayText .= '<span id="disconnectDetails">You have been disconnected. Please connect to your bank!</span>';
            $displayText .= '</div>';
    $displayText .= '</div>';    
    $displayText .= '</div>';
    
    return $displayText;
}
add_shortcode( 'PLAIDWORDPRESS', 'plaidwp_custom_shortcode' );


// Enqueue scripts for this plugin
function plaidwp_enqueue_scripts() {
    global $post;

    // Determine whether this page contains "PLAIDWORPDRESS" shortcode.
    if( ( is_single() || is_page() ) && has_shortcode( $post->post_content, 'PLAIDWORDPRESS' ) ) {
        // STYLES
        // Bootstrap CDN - https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css
        wp_enqueue_style( 'bootstrap-css','https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css', false, null );
        wp_enqueue_style( 'common-style', PLAIDWORDPRESSURL . '/css/common_style.css' );

        // SCRIPTS
        // Plaid script - https://cdn.plaid.com/link/v2/stable/link-initialize.js
        wp_enqueue_script( 'plaidlinkinitialize-js', 'https://cdn.plaid.com/link/v2/stable/link-initialize.js', false, null );
        // Boostrap script - https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js
        wp_enqueue_script( 'bootstrap-js', 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js', false, null );
        // Custom Script with JQuery
        wp_enqueue_script('plaidwp-scripts', PLAIDWORDPRESSURL.'/js/common_script.js', array('jquery'));

        wp_localize_script( 'plaidwp-scripts', 'plaidwpscriptsajax', array( 
            'ajaxurl' => admin_url( 'admin-ajax.php' ),
            'nonce'   =>  wp_create_nonce('plaidwp_nonce'),
             ) );
    }
}
add_action( 'wp_enqueue_scripts', 'plaidwp_enqueue_scripts' );

// Enqueue admin scripts for this plugin
function plaidwp_enqueue_admin_scripts() {

    if( $_GET['page'] === 'init-plaid-settings' ) {
        wp_enqueue_style( 'plaidwp-admin-style', PLAIDWORDPRESSURL . '/css/admin_style.css' );
        wp_enqueue_script( 'plaidwp-admin-script', PLAIDWORDPRESSURL . '/js/admin_script.js', array('jquery') );
    }
}
add_action( 'admin_enqueue_scripts', 'plaidwp_enqueue_admin_scripts' );

// AJAX Handler
add_action( 'wp_ajax_nopriv_plaidwp_ajaxhandler', 'plaidwp_ajaxhandler' );
add_action( 'wp_ajax_plaidwp_ajaxhandler', 'plaidwp_ajaxhandler' );

// Plaid APIs callback function
function plaidwp_ajaxhandler() {
    if ( !wp_verify_nonce( $_REQUEST['nonce'], 'plaidwp_nonce')) {
        
        exit('Wrong nonce');
    }
    
    // Get API keys from database
    $values = get_option('plaidwp_settings'); 

    if( ! empty( $values ) ) {
        foreach($values as $key => $value) {
            if($key == 'client_id') {
                $client_id = ! empty( $value ) ? $value : '';
            }
            if($key == 'client_secret') {
                $client_secret = ! empty( $value ) ? $value : '';
            }
            if($key == 'plaid_url') {
                $plaid_url = ! empty( $value ) ? $value : '';
            }
            if($key == 'callback_url') {
                $callback_url = ! empty( $value ) ? $value : '';
            }
        }
    }

    // Check process and assign api_url and data to use.
    if ( $_POST['process'] == 'create_plaid_link_token' ) {
        $api_url = $plaid_url . '/link/token/create';
        $data = array(
            'client_id'       =>  $client_id,
            'secret'          =>  $client_secret,
            'client_name'     =>  'Taxsurety Test App',
            'user'            =>  array('client_user_id'  =>  'unique_user_id'),
            'products'        =>  ['transactions'],
            //'products'        =>  ['auth', 'assets', 'identity', 'income', 'investments', 'liabilities', 'transactions'],
            'country_codes'   =>  ['US'],
            'language'        =>  'en',
            'redirect_uri'    =>  $callback_url,
        );
    } 
    
    if ( $_POST['process'] == 'process_plaid_token' ) {
        $api_url = $plaid_url . '/item/public_token/exchange';
        $data = array(
            'client_id'       =>  $client_id,
            'secret'          =>  $client_secret,
            'public_token'    =>  $_POST['public_token'],
        );

        // Save Tokens and IDs to database for customer logs using metadata object.
        // saveCustomerToken(customer_id, token_type, token);
    }
    
    if ( $_POST['process'] == 'get_accounts_balance' ) {
        $api_url = $plaid_url . '/accounts/balance/get';
        $data = array(
            'client_id'       =>  $client_id,
            'secret'          =>  $client_secret,
            'access_token'    =>  $_POST['access_token'],
        );
    }

    if ( $_POST['process'] == 'get_bank_name' ) {
        $api_url = $plaid_url . '/institutions/get_by_id';
        $data = array(
            'institution_id'  =>  $_POST['institution_id'],
            'client_id'       =>  $client_id,
            'secret'          =>  $client_secret,
            'country_codes'   =>  ['US'],
        );
    }

    
    $data_fields = json_encode($data);

    $args = array(
        'method'            =>  'POST',
        'headers'           =>  array(
                'Content-Type'      => 'application/json',
                'Content-Length'    =>  strlen($data_fields),
        ),
        'body'              => $data_fields,
    );

    $response = wp_remote_post( $api_url, $args );

    echo $response['body'];
    die();
}

// Save Customer Tokens
function saveCustomerTokenDB($customer_id, $token_type, $token) {
    // Save information to database...
    global $wpdb;
    $table_name = $wpdb->prefix . 'plaidwp_customer_tokens';
 
    $wpdb->insert($table_name, array(
            'id'            => null,
            'customer_id'   => $customer_id,
            'token_type'    => $token_type,
            'token'         => $token,
            'date_created'    => date("Y-m-d h:i:s"),
            ),
            array('%d','%s','%s','%s', '%s') 
    );
    echo "<script>console.log('Customer token saved!');</script>";
    
}



