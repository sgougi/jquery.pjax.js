/*
 * 
 * pjax
 * 
 * ---
 * @Copyright(c) 2012, falsandtru
 * @license MIT  http://opensource.org/licenses/mit-license.php  http://sourceforge.jp/projects/opensource/wiki/licenses%2FMIT_license
 * @version 1.13.2
 * @updated 2013/06/27
 * @author falsandtru  http://fat.main.jp/  http://sa-kusaku.sakura.ne.jp/
 * @CodingConventions Google JavaScript Style Guide
 * ---
 * Note: 
 * 
 * ---
 * Example:
 * @jquery 1.7.2
 * 
 * $.pjax( { area : 'div.pjax:not(.no-pjax)' } ) ;
 *
 * or
 *
 * $( 'div.pjaxLinkArea' ).pjax(
 * {
 *   area : 'div.pjax:not(.no-pjax)' ,
 *   link : 'a.pjaxLinks' ,
 *   scrollTop : null ,
 *   scrollLeft : null ,
 *   callback : callback ,
 *   callbacks :
 *   {
 *     ajax :
 *     {
 *       beforeSend : function( arg , XMLHttpRequest ){ XMLHttpRequest.overrideMimeType( 'text/html;charset=UTF-8' ) ; }
 *       error : error
 *     }
 *   }
 *   wait : 100
 * }) ;
 *
 * function callback()
 * {
 *   if( window._gaq ){ _gaq.push( ['_trackPageview'] ) ; }
 * }
 *
 * function error( arg , XMLHttpRequest )
 * {
 *   alert( 'pjax cancel.\n' + XMLHttpRequest.status + ' ' + XMLHttpRequest.statusText ) ;
 * }
 * 
 */

( function () {
  
  if ( typeof window.jQuery === 'undefined' ) { return ; } ;
  
  var $ = jQuery = window.jQuery , undefined = void( 0 ) , win = window , doc = document , plugin_data = [ 'settings' ] ;
  
  jQuery.fn.pjax = pjax ;
  jQuery.pjax = pjax ;
  pjax = null ;
  
  
  function pjax( options ) {
    
    /* Transfer process */
    if ( typeof this === 'function' ) { return arguments.callee.apply( jQuery( doc ) , arguments ) ; } ;
    
    /* validate */ var validate = window.validator instanceof Object ? window.validator : false ;
    /* validate */ var validate = validate ? validate.clone( { name : 'jquery.pjax.js' , base : true , timeout : { limit : options && options.ajax && options.ajax.timeout ? options.ajax.timeout + validate.timeout.limit : validate.timeout.limit } } ) : validate ;
    /* validate */ validate && validate.start() ;
    /* validate */ validate && validate.test( '++', 1, 0, 'pjax()' ) ;
    
    /* Variable initialization */
    var defaults = {
          id : 0 ,
          gns : 'pjax' ,
          ns : undefined ,
          area : undefined ,
          link : 'a:not([target])[href^="/"]' ,
          form : undefined ,
          scrollTop : 0 ,
          scrollLeft : 0 ,
          ajax : {} ,
          contentType : 'text/html' ,
          cache : { click : false , submit : false , popstate : false , length : 9 /* pages */ , size : 1*1024*1024 /* 1MB */ , expire : 30*60*1000 /* 30min */ } ,
          callback : function () {} ,
          callbacks : { ajax : {} , update : { url : {} , title : {} , content : {} , css : {} , script : {} , cache : { load : {} , save : {} } , verify : {} } , async : false } ,
          parameter : undefined ,
          load : { css : false , script : false , sync : true , async : 0 } ,
          interval : 300 ,
          wait : 0 ,
          fallback : true ,
          server : { query : '' } ,
          speedcheck : false
        } ,
        settings = jQuery.extend( true , {} , defaults , options ) ,
        nsArray = [ settings.gns ].concat( settings.ns || [] ) ;
    
    jQuery.extend
    (
      true ,
      settings ,
      {
        nss : {
          pjax : nsArray.join( '.' ) ,
          click : [ 'click' ].concat( nsArray.join( ':' ) ).join( '.' ) ,
          submit : [ 'submit' ].concat( nsArray.join( ':' ) ).join( '.' ) ,
          popstate : [ 'popstate' ].concat( nsArray.join( ':' ) ).join( '.' ) ,
          data : nsArray.join( ':' ) ,
          class4html : nsArray.join( '-' ) ,
          requestHeader : [ 'X' , nsArray[ 0 ].replace( /^\w/ , function ( $0 ) { return $0.toUpperCase() ; } ) ].join( '-' ) ,
          array : nsArray
        } ,
        server : { query : settings.server.query.length ? settings.server.query : settings.gns } ,
        log : { script : {} , speed : {} } ,
        history : { config : settings.cache , order : [] , data : {} /*, size : 0*/ } ,
        timestamp : ( new Date() ).getTime() ,
        disable : false ,
        on : on ,
        off : off ,
        landing : win.location.href ,
        validate : validate ,
        retry : true ,
        speed : { now : function () { return ( new Date() ).getTime() ; } }
      }
    ) ;
    
    share() ;
    
    /* Process startup */
    if ( check() ) { register( this , settings ) ; } ;
    
    /* validate */ validate && validate.end() ;
    
    return { on : settings.on , off : settings.off } ; // function: pjax
    
    
    /* Function declaration */
    
    function check() {
      if ( !supportPushState() ) { return false ; } ;
      if ( !jQuery( settings.area ).length ) { return false ; }
      return true ;
    } // function: check
    
    function supportPushState() {
      return 'pushState' in win.history && win.history[ 'pushState' ] !== null ;
    } // function: supportPushState
    
    function register( context , settings ) {
      settings.id = plugin_data.length ;
      plugin_data.push( settings )
      
      DELEGATE_CLICK : {
        if ( !settings.link ) { break DELEGATE_CLICK ; } ;
        
        jQuery( context )
        .undelegate( settings.link , settings.nss.click )
        .delegate( settings.link , settings.nss.click , settings.id , function ( event ) {
          event.timeStamp = ( new Date() ).getTime() ;
          
          if ( event.which>1 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ) { return this ; } ;
          if ( win.location.protocol !== this.protocol || win.location.host !== this.host ) { return this ; } ;
          if ( win.location.pathname === this.pathname && win.location.search === this.search && win.location.hash !== this.hash ) { return this ; } ;
          
          var settings, url , cache ;
          settings = plugin_data[ event.data ] ;
          url = this.href ;
          if ( settings.cache[ event.type.toLowerCase() ] ) { cache = fnCache( settings.history , url ) ; } ;
          if ( settings.landing ) { settings.landing = false ; } ;
          if ( settings.disable ) { event.preventDefault() ; return false ; } else { settings.off() ; } ;
          
          drive( this , event , url , url !== win.location.href , cache ) ;
          event.preventDefault() ;
          return false ;
        } ) ;
      } ; // label: DELEGATE_CLICK
      
      DELEGATE_SUBMIT : {
        if ( !settings.form ) { break DELEGATE_SUBMIT ; } ;
        
        jQuery( context )
        .undelegate( settings.form , settings.nss.submit )
        .delegate( settings.form , settings.nss.submit , settings.id , function ( event ) {
          event.timeStamp = ( new Date() ).getTime() ;
          
          var settings, url , cache ;
          settings = plugin_data[ event.data ] ;
          url = this.action ;
          if ( settings.cache[ event.type.toLowerCase() ] ) { cache = fnCache( settings.history , url ) ; } ;
          if ( settings.landing ) { settings.landing = false ; } ;
          if ( settings.disable ) { event.preventDefault() ; return false ; } else { settings.off() ; } ;
          
          drive( this , event , url , true , cache ) ;
          event.preventDefault() ;
          return false ;
        } ) ;
      } ; // label: DELEGATE_SUBMIT
      
      BIND_POPSTATE : {
        jQuery( win )
        .unbind( settings.nss.popstate )
        .bind( settings.nss.popstate , settings.id , function ( event ) {
          event.timeStamp = ( new Date() ).getTime() ;
          
          var settings, url , cache ;
          settings = plugin_data[ event.data ] ;
          url = win.location.href ;
          if ( settings.cache[ event.type.toLowerCase() ] ) { cache = fnCache( settings.history , url ) ; } ;
          if ( settings.landing ) { if ( settings.landing === win.location.href ) { settings.landing = false ; return ; } ; settings.landing = false ; } ;
          if ( settings.disable ) { event.preventDefault() ; return false ; } else { settings.off() ; } ;
          
          drive( this , event , url , false , cache ) ;
          event.preventDefault() ;
          return false ;
        } ) ;
      } ; // label: BIND_POPSTATE
      
      jQuery( 'script[src]' ).each( function () {
        if ( !( this.src in settings.log.script ) ) { settings.log.script[ this.src ] = true ; } ;
      } ) ;
    } // function: register
    
    function drive( context , event , url , register , cache ) {
      /* validate */ var validate = plugin_data[ settings.id ] && plugin_data[ settings.id ].validate ? plugin_data[ settings.id ].validate.clone( { name : 'jquery.pjax.js - drive()' } ) : validate ;
      /* validate */ validate && validate.start() ;
      /* validate */ validate && ( validate.scope = function( code ){ return eval( code ) ; } ) ;
      /* validate */ validate && validate.test( 1, 1, [ url, event.type ], 'drive()' ) ;
      /* validate */ validate && validate.test( 2, 1, 0, 'drive:start' ) ;
      
      settings.speedcheck && ( settings.log.speed.fire = event.timeStamp ) ;
      settings.speedcheck && ( settings.log.speed.time = [] ) ;
      settings.speedcheck && ( settings.log.speed.name = [] ) ;
      settings.speedcheck && settings.log.speed.name.push( 'fire' ) ;
      settings.speedcheck && settings.log.speed.time.push( settings.speed.now() - settings.log.speed.fire ) ;
      
      
      if ( fire( settings.callbacks.before , context , [ event , settings.parameter ] , settings.callbacks.async ) === false ) { return ; } ; // function: drive
      
      if ( cache ) {
        /* validate */ validate && validate.test( 3, 1, 0, 'drive:update' ) ;
        if ( jQuery.when ) {
          jQuery.when( wait( settings.wait ) ).done( function () { update( cache ) ; } ) ;
        } else {
          update( cache )  ;
        } ;
        /* validate */ validate && validate.test( 4, 1, 0, 'drive:end' ) ;
        /* validate */ validate && validate.end() ;
        return ;
      } ;
      
      /* validate */ validate && validate.test( 3, 1, 0, 'drive:initialize' ) ;
      var data ,
          dataType ,
          XMLHttpRequest ,
          textStatus ,
          errorThrown ,
          dataSize ,
          query = [] ,
          request = [] ,
          callbacks = {
            xhr : function () {
              XMLHttpRequest = fire( settings.callbacks.ajax.xhr , context , [ event , settings.parameter ] , settings.callbacks.async ) ;
              XMLHttpRequest = XMLHttpRequest instanceof Object && XMLHttpRequest instanceof win.XMLHttpRequest ? XMLHttpRequest : XMLHttpRequest || jQuery.ajaxSettings.xhr() ;
              
              //if ( XMLHttpRequest instanceof Object && XMLHttpRequest instanceof win.XMLHttpRequest && 'onprogress' in XMLHttpRequest ) {
              //  XMLHttpRequest.addEventListener( 'progress' , function ( event ) { dataSize = event.loaded ; } , false ) ;
              //} ;
              return XMLHttpRequest ;
            } ,
            dataFilter : function () {
              data = arguments[ 0 ] ;
              dataType = arguments[ 1 ] ;
              
              return fire( settings.callbacks.ajax.dataFilter , context , [ event , settings.parameter , data , dataType ] , settings.callbacks.async ) || data ;
            } ,
            complete : function () {
              XMLHttpRequest = arguments[ 0 ] ;
              textStatus = arguments[ 1 ] ;
              
              fire( settings.callbacks.ajax.complete , context , [ event , settings.parameter , XMLHttpRequest , textStatus ] , settings.callbacks.async ) ;
            }
          } ;
      
      for ( var i in callbacks ) {
        if ( i in settings.callbacks.ajax || i === 'xhr' ) { continue ; } ;
        delete callbacks[ i ] ;
      } ;
      
      /* validate */ validate && validate.test( 4, 1, 0, 'drive:popstate' ) ;
      POPSTATE : {
        if ( event.type.toLowerCase() !== 'popstate' ) { break POPSTATE ; } ;
        
        GET : {
          query = url.match( /\?[^\s]*/ ) ;
          if ( !query || query[ 0 ] === '?' ) { break GET ; } ;
          
          settings.ajax.type = 'GET' ;
        } ;
        settings.ajax.data = null ;
      } ;
      
      /* validate */ validate && validate.test( 5, 1, 0, 'drive:submit' ) ;
      SUBMIT : {
        if ( event.type.toLowerCase() !== 'submit' ) { break SUBMIT ;} ;
        
        url = url.replace( /\?[^\s]*/ , '' ) ;
        settings.ajax.type = jQuery( event.target ).attr( 'method' ).toUpperCase() ;
        
        GET : {
          if ( settings.ajax.type !== 'GET' ) { break GET ;} ;
          
          /* validate */ validate && validate.test( 5.1, 1, jQuery( event.target ).serialize(), 'drive:serialize' ) ;
          url += '?' + jQuery( event.target ).serialize() ;
          settings.ajax.data = null ;
        } ;
        
        POST : {
          if ( settings.ajax.type !== 'POST' ) { break POST ;} ;
          
          /* validate */ validate && validate.test( 5.1, 1, jQuery( event.target ).serializeArray(), 'drive:serializeArray' ) ;
          settings.ajax.data = jQuery( event.target ).serializeArray() ;
        } ;
      } ;
      
      /* validate */ validate && validate.test( 6, 1, 0, 'drive:url' ) ;
      URL : {
        if ( !settings.server.query ) { break URL ; } ;
        url = url.replace( /(#[^\s]*|)$/ , ( !url.match( /\?/ ) ? '?' :'&' ) + encodeURIComponent( settings.server.query ) + '=1' + '$1' ) ;
      } ;
      
      /* validate */ validate && validate.test( 7, 1, 0, 'drive:ajax' ) ;
      settings.speedcheck && settings.log.speed.name.push( 'ajax_start' ) ;
      settings.speedcheck && settings.log.speed.time.push( settings.speed.now() - settings.log.speed.fire ) ;
      jQuery.when ? ajax_regular() : ajax_legacy() ;
      
      if ( fire( settings.callbacks.after , context , [ event , settings.parameter ] , settings.callbacks.async ) === false ) { return ; } ; // function: drive
      /* validate */ validate && validate.test( 8, 1, 0, 'drive:end' ) ;
      /* validate */ validate && validate.end() ;
      
      
      /* ajax function */
      
      function ajax_regular() {
        jQuery
        .when
        (
          wait( settings.wait ) ,
          jQuery.ajax
          (
            jQuery.extend
            (
              true , {} ,
              settings.ajax ,
              callbacks ,
              {
                url : url ,
                beforeSend : function () {
                  XMLHttpRequest = arguments[ 0 ] ;
                  
                  XMLHttpRequest.setRequestHeader( settings.nss.requestHeader , 'true' ) ;
                  XMLHttpRequest.setRequestHeader( settings.nss.requestHeader + '-Area' , settings.area ) ;
                  XMLHttpRequest.setRequestHeader( settings.nss.requestHeader + '-CSS' , settings.load.css ) ;
                  XMLHttpRequest.setRequestHeader( settings.nss.requestHeader + '-Script' , settings.load.script ) ;
                  
                  fire( settings.callbacks.ajax.beforeSend , context , [ event , settings.parameter , XMLHttpRequest ] , settings.callbacks.async ) ;
                } ,
                success : function () {
                  data = arguments[ 0 ] ;
                  dataType = arguments[ 1 ] ;
                  XMLHttpRequest = arguments[ 2 ] ;
                  
                  fire( settings.callbacks.ajax.success , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) ;
                } ,
                error : function () {
                  XMLHttpRequest = arguments[ 0 ] ;
                  textStatus = arguments[ 1 ] ;
                  errorThrown = arguments[ 2 ] ;
                  
                  /* validate */ var validate = plugin_data[ settings.id ] && plugin_data[ settings.id ].validate ? plugin_data[ settings.id ].validate.clone( { name : 'jquery.pjax.js - drive()' } ) : validate ;
                  /* validate */ validate && validate.start() ;
                  /* validate */ validate && validate.test( '++', 1, [ url, win.location.href ], 'ajax_regular()' ) ;
                  /* validate */ validate && validate.test( '++', 1, [ XMLHttpRequest, textStatus, errorThrown ], 'ajax error' ) ;
                  fire( settings.callbacks.ajax.error , context , [ event , settings.parameter , XMLHttpRequest , textStatus , errorThrown ] , settings.callbacks.async ) ;
                  if ( settings.fallback ) { return typeof settings.fallback === 'function' ? settings.fallback( event ) : fallback( event , validate ) ; } ;
                  /* validate */ validate && validate.end() ;
                }  
              }
            )
          )
        )
        .done( function () { update() ; } )
        .fail()
        .always() ;
      } // function: ajax_regular
      
      /* + legacy support */
      function ajax_legacy() {
        /* + when */
        jQuery.ajax
        (
          jQuery.extend
          (
            true , {} ,
            settings.ajax ,
            callbacks ,
            {
              url : url ,
              beforeSend : function () {
                XMLHttpRequest = arguments[ 0 ] ;
                
                XMLHttpRequest.setRequestHeader( settings.nss.requestHeader , 'true' ) ;
                XMLHttpRequest.setRequestHeader( settings.nss.requestHeader + '-Area' , settings.area ) ;
                XMLHttpRequest.setRequestHeader( settings.nss.requestHeader + '-CSS' , settings.load.css ) ;
                XMLHttpRequest.setRequestHeader( settings.nss.requestHeader + '-Script' , settings.load.script ) ;
                
                fire( settings.callbacks.ajax.beforeSend , context , [ event , settings.parameter , XMLHttpRequest ] , settings.callbacks.async ) ;
              } ,
              success : function () {
                data = arguments[ 0 ] ;
                dataType = arguments[ 1 ] ;
                XMLHttpRequest = arguments[ 2 ] ;
                
                fire( settings.callbacks.ajax.success , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) ;
                
                update() ;
              } ,
              error : function () {
                XMLHttpRequest = arguments[ 0 ] ;
                textStatus = arguments[ 1 ] ;
                errorThrown = arguments[ 2 ] ;
                
                /* validate */ var validate = plugin_data[ settings.id ] && plugin_data[ settings.id ].validate ? plugin_data[ settings.id ].validate.clone( { name : 'jquery.pjax.js - drive()' } ) : validate ;
                /* validate */ validate && validate.start() ;
                /* validate */ validate && validate.test( '++', 1, [ url, win.location.href ], 'ajax_legacy()' ) ;
                /* validate */ validate && validate.test( '++', 1, [ XMLHttpRequest, textStatus, errorThrown ], 'ajax error' ) ;
                fire( settings.callbacks.ajax.error , context , [ event , settings.parameter , XMLHttpRequest , textStatus , errorThrown ] , settings.callbacks.async ) ;
                if ( settings.fallback ) { return typeof settings.fallback === 'function' ? settings.fallback( event ) : fallback( event , validate ) ; } ;
                /* validate */ validate && validate.end() ;
              }
            }
          )
        )
        /* - when */
      } // function: ajax_legacy
      /* - legacy support */
    
      function update( cache ) {
        /* validate */ var validate = plugin_data[ settings.id ] && plugin_data[ settings.id ].validate ? plugin_data[ settings.id ].validate.clone( { name : 'jquery.pjax.js - update()' } ) : validate ;
        /* validate */ validate && validate.start() ;
        /* validate */ validate && ( validate.scope = function( code ){ return eval( code ) ; } ) ;
        /* validate */ validate && validate.test( '1', 1, 0, 'update()' ) ;
        /* validate */ validate && validate.test( '++', 1, 0, 'update:start' ) ;
        UPDATE : {
          settings.speedcheck && settings.log.speed.name.push( 'update_start' ) ;
          settings.speedcheck && settings.log.speed.time.push( settings.speed.now() - settings.log.speed.fire ) ;
          if ( fire( settings.callbacks.update.before , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE ; } ;
          
          /* variable initialization */
          var win = window ,
              doc = document ,
              title ,
              css ,
              script ;
          
          try {
            
            /* validate */ validate && validate.test( '++', 1, 0, 'update:try' ) ;
            /* validate */ validate && validate.test( '++', 1, !cache ? [ settings.contentType, XMLHttpRequest.getResponseHeader( 'Content-Type' ) ] : 0, 'update:content-type' ) ;
            if ( !cache && !( new RegExp( settings.contentType.replace( /\s*[,;]\s*(.|$)/g , function () { return arguments[ 1 ] ? '|' + arguments[ 1 ] : '' ; } ) , 'i' ) ).test( XMLHttpRequest.getResponseHeader( 'Content-Type' ) ) ) { throw new Error( "throw: content-type mismatch" ) ; } ;
            
            /* cache */
            /* validate */ validate && validate.test( '++', cache ? "'usable'" : "'unusable'", 0, 'update:cache' ) ;
            UPDATE_CACHE : {
              if ( !cache ) { break UPDATE_CACHE ; } ;
              if ( fire( settings.callbacks.update.cache.load.before , context , [ event , settings.parameter , cache ] , settings.callbacks.async ) === false ) { break UPDATE_CACHE ; } ;
              XMLHttpRequest = cache.XMLHttpRequest ;
              data = XMLHttpRequest.responseText ;
              dataType = cache.dataType ;
              title = cache.title ;
              css = cache.css ;
              script = cache.script ;
              if ( fire( settings.callbacks.update.cache.load.after , context , [ event , settings.parameter , cache ] , settings.callbacks.async ) === false ) { break UPDATE_CACHE ; } ;
            } ; // label: UPDATE_CACHE
            
            /* variable initialization */
            /* validate */ validate && validate.test( '++', 1, 0, 'update:initialize' ) ;
            var page = jQuery( data ) ,
                parsable = 0 < page.filter( 'title' ).length ,
                areas = settings.area.replace( /(\((.*?(\(.*?\).*?)?)*?\)|\S)(,|$)/g , function () { return arguments[1] + ( arguments[4] ? '|' : '' ) } ).split( /\s*\|(?!=)\s*/ ) ,
                scrollX = settings.scrollLeft === null ? jQuery( win ).scrollLeft() : parseInt( settings.scrollLeft ) ,
                scrollY = settings.scrollTop === null ? jQuery( win ).scrollTop() : parseInt( settings.scrollTop ) ;
            
            title = title ? title
                          : parsable ? page.filter( 'title' ).text() : jQuery( '<span/>' ).html( find( data , '<title>([^<]*)</title>' ).join() ).text() ;
            
            if ( !jQuery( settings.area ).length || !page.find( settings.area ).add( page.filter( settings.area ) ).length ) { throw new Error( 'throw: area length mismatch' ) ; } ;
            
            /* url */
            /* validate */ validate && validate.test( '++', 1, url, 'update:url' ) ;
            UPDATE_URL : {
              if ( fire( settings.callbacks.update.url.before , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE_URL ; } ;
              url = url.replace( new RegExp( '[?&]' + settings.server.query + '=[^&#]*' ) , '' ) ;
              register && win.history.pushState( settings.gns , win.opera || win.navigator.userAgent.toLowerCase().indexOf( 'opera' ) !== -1 ? title : doc.title , url ) ;
              switch ( true ) {
                case !register :
                  break ;
                case /Mobile(\/\w+)? Safari/i.test( win.navigator.userAgent ) :
                  win.history.back() ;
                  win.history.forward() ;
                  break ;
              } ;
              if ( fire( settings.callbacks.update.url.after , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE_URL ; } ;
            } ;
            
            /* title */
            /* validate */ validate && validate.test( '++', 1, title, 'update:title' ) ;
            UPDATE_TITLE : {
              if ( fire( settings.callbacks.update.title.before , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE_TITLE ; } ;
              doc.title = title ;
              if ( fire( settings.callbacks.update.title.after , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE_TITLE ; } ;
            } ;
            
            /* content */
            /* validate */ validate && validate.test( '++', 1, areas, 'update:content' ) ;
            UPDATE_CONTENT : {
              if ( fire( settings.callbacks.update.content.before , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE_CONTENT ; } ;
              for ( var i = 0 , area ; area = areas[ i ] ; i++ ) {
                jQuery( area ).html( page.find( area ).add( page.filter( area ) ).children() ) ;
                settings.load.script && settings.load.sync && jQuery( area ).append( jQuery( '<div/>' , {
                  'class' : settings.nss.class4html + '-loaded' , 'style' : 'display: block !important; visibility: hidden !important; width: auto !important; height: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important; position: absolute !important; top: -9999px !important; left: -9999px !important; font-size: 12px !important; text-indent: 0 !important;'
                } ).text( 'pjax' ) ) ;
              } ;
              if ( fire( settings.callbacks.update.content.after , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE_CONTENT ; } ;
            } ;
            
            /* css */
            /* validate */ validate && validate.test( '++', 1, 0, 'update:css' ) ;
            settings.load.css && setTimeout( function () { load_css() ; } , settings.load.async || 0 ) ;
            function load_css() {
              /* validate */ var validate = plugin_data[ settings.id ] && plugin_data[ settings.id ].validate ? plugin_data[ settings.id ].validate.clone( { name : 'jquery.pjax.js - load_css()' } ) : validate ;
              /* validate */ validate && validate.start() ;
              /* validate */ validate && ( validate.scope = function( code ){ return eval( code ) ; } ) ;
              UPDATE_CSS : {
                if ( fire( settings.callbacks.update.css.before , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE_CSS ; } ;
                
                css = css ? css
                          : parsable ? page.find( 'link[rel~="stylesheet"], style' ).add( page.filter( 'link[rel~="stylesheet"], style' ) )
                                     : find( data , '(<link[^>]*?rel=.[^"\']*stylesheet[^>]*>|<style[^>]*>(.|[\n\r])*?</style>)' ) ;
                fnCache( settings.history , url ) && ( fnCache( settings.history , url ).css = css ) ;
                
                // 対象現行全要素に削除フラグを立てる。
                jQuery( 'link[rel~="stylesheet"], style' ).filter( function () { return jQuery.data( this , settings.nss.data , true ) ; } ) ;
                // 対象移行全要素を走査する。
                for ( var i = 0 , element , links = jQuery( 'link[rel~="stylesheet"]' ) , styles = jQuery( 'style' ) , consistent ; element = css[ i ] ; i++ ) {
                  
                  consistent = false ;
                  element = parsable ? element : jQuery( element )[ 0 ] ;
                  
                  LINK : {
                    if ( element.tagName.toUpperCase() !== 'LINK' ) { break LINK ; } ;
                    // 現行要素と移行要素を比較、一致するものがあれば次の走査へ移る。
                    // 一致するものがなければ移行要素を追加し、一致するものがない現行要素を削除する。
                    if
                    (
                      links.filter( function () {
                        // 一致しないためFALSEを返す
                        if ( consistent || this.href !== element.href ) { return false ; } ;
                        // 一致したためTRUEを返す。一致した要素に削除フラグが立っていればこれを消す。
                        consistent = true ;
                        jQuery.data( this , settings.nss.data ) && jQuery.data( this , settings.nss.data , false ) ;
                        return true ;
                      } ).length
                    ) { continue ; } ;
                  } ;
                  
                  STYLE : {
                    if ( element.tagName.toUpperCase() !== 'STYLE' ) { break STYLE ; } ;
                    if
                    (
                      styles.filter( function () {
                        if ( consistent || !jQuery.data( this , settings.nss.data ) || this.innerHTML !== element.innerHTML ) { return false ; } ;
                        consistent = true ;
                        jQuery.data( this , settings.nss.data , false ) ;
                        return true ;
                      } ).length
                    ) { continue ; } ;
                  } ;
                  
                  jQuery.data( jQuery( 'head' ).append( element ).children( ':last-child' )[ 0 ] , settings.nss.data , false ) ;
                  element = null ;
                } ;
                jQuery( 'link[rel~="stylesheet"], style' ).filter( function () { return jQuery.data( this , settings.nss.data ) ; } ).remove() ;
                
                if ( fire( settings.callbacks.update.css.after , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE_CSS ; } ;
                settings.speedcheck && settings.log.speed.name.push( 'css' ) ;
                settings.speedcheck && settings.log.speed.time.push( settings.speed.now() - settings.log.speed.fire ) ;
              } ; // label: UPDATE_CSS
              /* validate */ validate && validate.end() ;
            } // function: css
            
            /* script */
            /* validate */ validate && validate.test( '++', 1, 0, 'update:script' ) ;
            settings.load.script && setTimeout( function () { load_script( 'async' ) ; } , settings.load.async || 0 ) ;
            function load_script( type ) {
              /* validate */ var validate = plugin_data[ settings.id ] && plugin_data[ settings.id ].validate ? plugin_data[ settings.id ].validate.clone( { name : 'jquery.pjax.js - load_script()' } ) : validate ;
              /* validate */ validate && validate.start() ;
              /* validate */ validate && ( validate.scope = function( code ){ return eval( code ) ; } ) ;
              UPDATE_SCRIPT : {
                if ( fire( settings.callbacks.update.script.before , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE_SCRIPT ; } ;
                
                var executes = [] ;
                
                script = script ? script
                                : parsable ? page.find( 'script' ).add( page.filter( 'script' ) )
                                           : find( data , '(?:[^\'\"]|^\s*)(<script[^>]*>(.|[\n\r])*?</script>)(?:[^\'\"]|\s*$)' ) ;
                fnCache( settings.history , url ) && ( fnCache( settings.history , url ).script = script ) ;
                
                for ( var i = 0 , element , defer , consistent ; element = script[ i ] ; i++ ) {
                  
                  consistent = false ;
                  element = parsable ? element : jQuery( element )[ 0 ] ;
                  
                  if ( type === 'sync' && !element.defer ) { continue ; } ;
                  if ( type === 'async' && element.defer ) { continue ; } ;
                  
                  if ( !element.childNodes.length && element.src in settings.log.script ) { continue ; } ;
                  if ( element.src ) { settings.log.script[ element.src ] = true ; } ;
                  
                  if ( jQuery.when ) {
                    element =  element.src ? jQuery.ajax( jQuery.extend( true , {} , settings.ajax , { url : element.src , dataType : 'script' , async : false , global : false } ) )
                                           : jQuery.Deferred().resolve( element ) ;
                    executes.push( element ) ;
                  } else {
                    jQuery( 'head' ).append( element ) ;
                  } ;
                  element = null ;
                } ;
                
                jQuery.when && executes.length &&
                jQuery.when.apply( null , executes )
                .done( function () {
                  for ( var i = 0 , exec ; exec = arguments[ i ] ; i++ ) {
                    0 < Number( exec.nodeType ) && ( exec.type === '' ||  exec.type.toLowerCase() === 'text/javascript' ) && eval( ( exec.text || exec.textContent || exec.innerHTML || '' ).replace( /^\s*<!(?:\[CDATA\[|\-\-)/ , '/*$0*/' ) ) ; /* */
                  } ;
                } ) ;
                
                if ( fire( settings.callbacks.update.script.after , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE_SCRIPT ; } ;
              } ; // label: UPDATE_SCRIPT
              /* validate */ validate && validate.end() ;
            } // function: script
            
            if ( settings.load.script && settings.load.sync ) {
              setTimeout( function () {
                if ( jQuery( settings.area ).length === jQuery( settings.area ).children( '.' + settings.nss.class4html + '-loaded' ).filter( function () { return this.clientWidth ; } ).length ) {
                  jQuery( settings.area ).children( '.' + settings.nss.class4html + '-loaded' ).remove() ;
                  setTimeout( function () { load_script( 'sync' ) ; } , 0 ) ;
                  settings.speedcheck && settings.log.speed.name.push( 'script' ) ;
                  settings.speedcheck && settings.log.speed.time.push( settings.speed.now() - settings.log.speed.fire ) ;
                  settings.speedcheck && console.log( settings.log.speed.time ) ;
                  settings.speedcheck && console.log( settings.log.speed.name ) ;
                } else {
                  setTimeout( function () { arguments.callee() ; } , settings.interval ) ;
                } ;
              } , 0 ) ;
            } else {
              settings.load.script && setTimeout( function () { load_script( 'sync' ) ; } , settings.load.async || 0 ) ;
            } ;
            
            /* scroll */
            /* validate */ validate && validate.test( '++', 1, 0, 'update:scroll' ) ;
            switch ( event.type.toLowerCase() ) {
              case 'click' :
              case 'submit' :
                win.scrollTo( scrollX , scrollY ) ;
                break ;
              case 'popstate' :
                if ( win.history.state instanceof Object && isFinite( win.history.state.scrollY ) ) {
                  win.scrollTo( scrollX , win.history.state.scrollY ) ;
                  win.history.state.scrollY = undefined ;
                  win.history.replaceState( win.history.state , title , url ) ;
                } ;
                break ;
            } ;
            
            /* cache */
            /* validate */ validate && validate.test( '++', 1, 0, 'update:cache' ) ;
            UPDATE_CACHE : {
              if ( !settings.cache.click && !settings.cache.submit && !settings.cache.popstate ) { break UPDATE_CACHE ; } ;
              if ( settings.ajax.type === 'POST' ) { break UPDATE_CACHE ; } ;
              if ( fire( settings.callbacks.update.cache.save.before , context , [ event , settings.parameter , cache ] , settings.callbacks.async ) === false ) { break UPDATE_CACHE ; } ;
              
              fnCache( settings.history , url , title , dataSize , data , dataType , XMLHttpRequest )
              
              if ( fire( settings.callbacks.update.cache.save.after , context , [ event , settings.parameter , cache ] , settings.callbacks.async ) === false ) { break UPDATE_CACHE ; } ;
            } ; // label: UPDATE_CACHE
            
            /* verify */
            /* validate */ validate && validate.test( '++', 1, 0, 'update:verify' ) ;
            UPDATE_VERIFY : {
              if ( fire( settings.callbacks.update.verify.before , context , [ event , settings.parameter ] , settings.callbacks.async ) === false ) { break UPDATE_VERIFY ; } ;
              if ( url === win.location.href ) {
                settings.retry = true ;
              } else if ( settings.retry ) {
                settings.retry = false ;
                drive( context , event , win.location.href , false , settings.cache[ event.type.toLowerCase() ] ? fnCache( settings.history , win.location.href ) : undefined ) ;
              } else {
                throw new Error( 'throw: location mismatch' ) ;
              } ;
              if ( fire( settings.callbacks.update.verify.after , context , [ event , settings.parameter ] , settings.callbacks.async ) === false ) { break UPDATE_VERIFY ; } ;
            } ;
            
            if ( fire( settings.callbacks.update.success , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE ; } ;
            if ( fire( settings.callbacks.update.complete , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE ; } ;
            if ( fire( settings.callback , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE ; } ;
            /* validate */ validate && validate.test( '++', 1, 0, 'update: success' ) ;
          } catch( err ) {
            /* validate */ validate && validate.test( '++', !String( err.message ).indexOf( "throw:" ), err, 'update:catch' ) ;
            /* validate */ validate && validate.test( '++', !( err.message === 'throw: location mismatch' && url !== win.location.href ), [ url, win.location.href ], "!( err.message === 'throw: location mismatch' && url !== win.location.href )" ) ;
            
            /* cache delete */
            UPDATE_CACHE : {
              if ( !cache ) { break UPDATE_CACHE ; } ;
              
              fnCache( settings.history , url , title , null )
              
            } ;
            
            if ( fire( settings.callbacks.update.error , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE ; } ;
            if ( fire( settings.callbacks.update.complete , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE ; } ;
            /* validate */ validate && validate.test( '++', 1, [ url, win.location.href ], 'update: error' ) ;
            if ( settings.fallback ) { return typeof settings.fallback === 'function' ? settings.fallback( event ) : fallback( event , validate ) ; } ;
          } ;
          
          if ( fire( settings.callbacks.update.after , context , [ event , settings.parameter , data , dataType , XMLHttpRequest ] , settings.callbacks.async ) === false ) { break UPDATE ; } ;
          
          settings.on() ;
          
          settings.speedcheck && settings.log.speed.name.push( 'end' ) ;
          settings.speedcheck && settings.log.speed.time.push( settings.speed.now() - settings.log.speed.fire ) ;
          /* validate */ validate && validate.test( '++', 1, 0, 'update:end' ) ;
          /* validate */ validate && validate.end() ;
        } ; // label: UPDATE
      } // function: update
    } // function: drive
    
    function fire( fn , context , args , async ) {
      if ( typeof fn === 'function' ) { return async ? setTimeout( function () { fn.apply( context , args ) } , 0 ) : fn.apply( context , args ) ; } ;
    } // function: fire
    
    function wait( ms ) {
      var dfd = jQuery.Deferred() ;
      if ( !ms ) { return dfd.resolve() ; } ;
      
      setTimeout( function () { dfd.resolve() ; } , ms ) ;
      return dfd.promise() ; // function: wait
    } // function: wait
    
    function fallback( event , validate ) {       
      /* validate */ validate && validate.test( '++', 1, 0, 'fallback()' ) ;
      /* validate */ validate && validate.end() ;
      if ( event.type.toLowerCase() === 'click' ) {
        win.location.href = event.currentTarget.href ;
      } else if ( event.type.toLowerCase() === 'submit' ) {
        context.submit() ;
      } else if ( event.type.toLowerCase() === 'popstate' ) {
        win.location.reload() ;
      } ;
    } // function: fallback
    
    function find( data , pattern ) {
      var result = [] ;
      data.replace( new RegExp( pattern , "gim" ) , function () { result.push( arguments[ 1 ] ) ; } )
      return result ;
    } // function: find
    
    function fnCache( history , url , title , size , data , dataType , XMLHttpRequest ) {
      var result ;
      
      switch ( true ) {
        case history === undefined || url === undefined :
          break ;
          
        case title === undefined :
          if ( history.data[ url ] && ( new Date() ).getTime() > history.data[ url ].timestamp + history.config.expire ) {
            arguments.callee( history , url , null , null ) ;
          } ;
          result = history.data[ url ] ;
          break ;
          
        case size === null :
          for ( var i = 0 , key ; key = history.order[ i ] ; i++ ) {
            if ( url === key ) {
              history.order.splice( i , 1 ) ;
              history.size -= history.data[ key ].size ;
              history.data[ key ] = null ;
              delete history.data[ key ] ;
            } ;
          } ;
          break ;
          
        default :
          history.order.unshift( url ) ;
          for ( var i = 1 , key ; key = history.order[ i ] ; i++ ) { if ( url === key ) { history.order.splice( i , 1 ) ; } ; } ;
          
          if ( history.data[ url ] ) { break ; } ;
          
          size = size || data.length * 1.8 ;
          history.size = history.size || 0 ;
          history.size += size ;
          history.data[ url ] = {
            data : null ,
            dataType : dataType ,
            XMLHttpRequest : XMLHttpRequest ,
            title : title ,
            size : size ,
            timestamp : ( new Date() ).getTime()
          } ;
          
          for ( var i = history.order.length - 1 , url ; url = history.order[ i ] ; i-- ) {
            if ( i >= history.config.length || history.size > history.config.size || ( new Date() ).getTime() > history.data[ url ].timestamp + history.config.expire ) {
              history.order.splice( i , 1 ) ;
              history.size = history.size || 0 ;
              history.size -= history.data[ url ].size ;
              history.data[ url ] = null ;
              delete history.data[ url ] ;
            } ;
          } ;
          break ;
      } ;
      
      return result ;
    } // function: fnCache
    
    function on() {
      for ( var i = 1 , len = plugin_data.length ; i < len ; i++ ) { plugin_data[ i ].disable = false ; } ;
    } // function: on
    
    function off() {
      for ( var i = 1 , len = plugin_data.length ; i < len ; i++ ) { plugin_data[ i ].disable = true ; } ;
    } // function: off
    
    function share() {
      
      if ( !jQuery.falsandtru ) { jQuery.fn.falsandtru = falsandtru ; jQuery.falsandtru = falsandtru ; } ;
      
      jQuery.falsandtru( 'share' , 'history' , settings.history ) ;
      settings.history = jQuery.falsandtru( 'share' , 'history' ) ;
      
    } // function: share
    
    function falsandtru( namespace , key , value ) {
      var obj , response ;
      
      switch ( true ) {
        case namespace === undefined :
          break ;
          
        case key === undefined :
          response = jQuery.falsandtru[ namespace ] ;
          break ;
          
        case value === undefined :
          response = namespace in jQuery.falsandtru ? jQuery.falsandtru[ namespace ][ key ] : undefined ;
          break ;
          
        case value !== undefined :
          if ( !( jQuery.falsandtru[ namespace ] instanceof Object ) ) { jQuery.falsandtru[ namespace ] = {} ; } ;
          if ( jQuery.falsandtru[ namespace ][ key ] instanceof Object && value instanceof Object ) {
            jQuery.extend( true , jQuery.falsandtru[ namespace ][ key ] , value )
          } else {
            jQuery.falsandtru[ namespace ][ key ] = value ;
          } ;
          response = jQuery.falsandtru[ namespace ][ key ] ;
          break ;
          
        default :
          break ;
      } ;
      
      return response ;
    } // function: falsandtru
    
    
  } // function: pjax
} )() ;
