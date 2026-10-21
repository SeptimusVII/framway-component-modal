// FEATURES TODO

// CURRENT
// style arrow outside modal
// 
// FEATURES DONE
// click on trigger without command
// adding modal trigger to dom create a new modal
// footer / actions
// style modal img
// load content - from content url/href
// white/black list of elements for loaded content
// setContent
// load content - from content attribute
// create from javascript object
// create from trigger in dom
// refresh
// gallery 
// header
// dismiss
// close button
// auto open
// auto destroy
// modal width

module.exports = function(){
    let Modal = Object.getPrototypeOf(fw).Modal = class Modal extends fw.Component{
        static {
            this.debug = false;
            this.createdAt  = "3.0.0";
            this.lastUpdate = "3.0.0";
            this.version = "2.0.0";
            this.tpl = utils.htmlToNode(require('bundle-tpl:./modal.html')).outerHTML;
            // this.describe();
            
            this.createFromTrigger = function(trigger){
                trigger.classList.add('modal__trigger');
                let modalID = trigger.getAttribute('commandfor')??trigger.dataset['modal']??trigger.dataset['id']??false;
                let modalDebug = trigger.dataset['debug']??Modal.debug;
                if(modalDebug) console.log('createFromTrigger')
                if(modalDebug) console.log(modalID);
                if(modalDebug) console.log("Trying to create modal "+modalID+" ...");
                if(document.querySelector('.modal[id="'+modalID+'"]') == null){
                    if(!modalID){
                        if (modalDebug) console.log('Failed to create modal from trigger: please define data-modal attribute\n ');
                        if (modalDebug) console.log(trigger);
                        return false;
                    }
                    if(!trigger.dataset['content'] && !trigger.getAttribute('href') && !trigger.dataset['url']){
                        if (modalDebug) console.log('Failed to create modal "'+modalID+'": please define data-content, data-url or href attributes \n ');
                        return false;
                    }

                    let objConfig = Object.assign({},trigger.dataset);
                    objConfig.id = modalID;
                    
                    if(trigger.dataset['content'])
                        objConfig.content = trigger.dataset['content'];
                    else if(trigger.dataset['url'])
                        objConfig.url = trigger.dataset['url'];
                    else if(trigger.getAttribute('href'))
                        objConfig.url = trigger.getAttribute('href');

                    if (!trigger.getAttribute('commandfor'))
                        trigger.setAttribute('commandfor', modalID)
                    if (!trigger.getAttribute('command'))
                        trigger.setAttribute('command', '--modal-open')

                    for(let k in objConfig)
                        objConfig[k] = objConfig[k] === 'true' ? true : objConfig[k] === 'false' ? false : objConfig[k];
                    if (modalDebug) console.log(objConfig);
                    let modal = new Modal(objConfig);
                } else {
                    if (modalDebug) console.log("Modal "+modalID+" already exist. Aborting creation \n ");
                    trigger.classList.add('ready')
                }
            }

            this.galleryKeyboardNav = function(event){
                // console.log(event);
                switch(event.which){
                    case 37: // left
                        Modal.prototype.log('go prev');
                        document.querySelector('.modal[open] .modal__arrow.prev').click();
                        break;
                    case 39: // right
                        Modal.prototype.log('go next');
                        document.querySelector('.modal[open] .modal__arrow.next').click();
                        break;
                    case 38: // up
                    case 40: // down
                    default: return; // exit this handler for other keys
                }
                event.preventDefault();
            };

            this.arrowClickHandler = document.addEventListener('click',(e)=>{
                let arrow = e.target.closest('.modal__arrow');
                if (arrow) {
                    let modal = arrow.closest('.modal').component;
                    let gallery = modal.gallery;
                    let current,next;
                    if (document.querySelectorAll('.modal[data-gallery='+gallery+']').length > 1) {
                        // console.log('navigating through existing modals');
                        current = modal.galleryIndex;
                        if (arrow.classList.contains('prev')) 
                            next = (current - 1 >= 0) ? current - 1 : document.querySelectorAll('.modal[data-gallery='+gallery+']').length - 1;
                        else if(arrow.classList.contains('next'))
                            next = (current + 1 <= (document.querySelectorAll('.modal[data-gallery='+gallery+']').length - 1)) ? current + 1 : 0; 
                        if (document.querySelector('.modal[data-gallery="'+gallery+'"][data-gallery-index="'+next+'"]')) 
                            document.querySelector('.modal[data-gallery="'+gallery+'"][data-gallery-index="'+next+'"]').component.open();
                    } else if(document.querySelectorAll('.modal__trigger[data-gallery='+gallery+']').length > 1){
                        // TODO
                        // console.log('navigating through modals triggers');
                    }
                }
            });
        }
        onCreate(){
            let modal = this;
            this.log('onCreate start')
            if (modal.el.nodeName != "DIALOG") {
                console.error("Error: trying to create a modal from a non-dialog html element. Creation aborted and Element removed.",this);
                modal.destroy();
                return;
            }
            if (!document.contains(modal.el)) {
                modal.log('adding modal element to dom')
                document.body.append(modal.el);
            }

            modal.id                    = modal.id                    ?? modal.getAttr('id','modal-'+utils.uniqid());
            modal.title                 = modal.title                 ?? modal.getData('title',false);
            modal.width                 = modal.width                 ?? modal.getData('width',false);
            modal.gallery               = modal.gallery               ?? modal.getData('gallery',false);
            modal.allowDismiss          = modal.allowDismiss          ?? modal.getData('allow-dismiss',true);
            modal.addCloseButton        = modal.addCloseButton        ?? modal.getData('close-button',true);
            modal.autoOpen              = modal.autoOpen              ?? modal.getData('auto-open',false);
            modal.autoLoad              = modal.autoLoad              ?? modal.getData('auto-load',true);
            modal.autoDestroy           = modal.autoDestroy           ?? modal.getData('auto-destroy',false);
            modal.addRefreshButton      = modal.addRefreshButton      ?? modal.getData('refresh',false);
            modal.onOpen                = modal.onOpen                ?? window[modal.getData('on-open',false)]    ?? function(){this.log('onOpen')};
            modal.onClose               = modal.onClose               ?? window[modal.getData('on-close',false)]   ?? function(){this.log('onClose')};
            modal.onRefresh             = modal.onRefresh             ?? window[modal.getData('on-refresh',false)] ?? function(){this.log('onRefresh')};
            modal.content               = modal.content               ?? (modal.el.innerHTML.trim() != '' ? modal.el.innerHTML.trim() : undefined) ?? modal.getData('content','');
            modal.contentGetSelector    = modal.contentGetSelector    ?? modal.getData('content-get-selector', false);
            modal.contentRemoveSelector = modal.contentRemoveSelector ?? modal.getData('content-remove-selector', false);
            modal.isolateHTML           = modal.isolateHTML           ?? modal.getData('isolate-html',false);
            modal.classes               = modal.classes               ?? modal.getData('classes',false);
            modal.actions               = modal.actions               ?? undefined;

            // HTML construction
            modal.el.id = modal.id;
            modal.wrapper = utils.htmlToNode('<div class="modal__wrapper"></div>');
            modal.contentWrapper = utils.htmlToNode('<div class="modal__content"></div>');
            modal.el.wrapInner(modal.contentWrapper);
            modal.el.wrapInner(modal.wrapper);
           
            modal.header            = utils.htmlToNode('<div class="modal__header"></div>');
            modal.topButtonsWrapper = utils.htmlToNode('<div class="modal__topButtonsWrapper"></div>');
            if (modal.title) 
                modal.header.append(utils.htmlToNode('<div class="modal__title"></div>'))
            modal.wrapper.prepend(modal.header);
            modal.wrapper.prepend(modal.topButtonsWrapper);

            if (modal.actions) {
                modal.footer = utils.htmlToNode('<div class="modal__footer"></div>');
                for(var id in modal.actions){
                    let action = modal.actions[id];
                    modal.log('adding action '+id+' to footer');
                    let button;
                    if(action.url && action.url != '')
                        button = utils.htmlToNode('<a class="btn" href="'+action.url+'"></a>');
                    else
                        button = utils.htmlToNode('<button></button>');
                    button.innerHTML = action.label ?? id;
                    if(action.classes)
                        for(var c of utils.segmentStr(action.classes))
                            button.classList.add(c)
                    if(action.action && typeof action.action == 'function' && !action.url)
                        button.addEventListener('click',action.action);
                    modal.footer.append(button)
                }
                modal.wrapper.append(modal.footer);
            }


            if (modal.classes){
                for(var c of utils.segmentStr(modal.classes))
                    modal.el.classList.add(c)
            } 

            if (modal.width) 
                modal.el.style.width = modal.width;

            if(modal.gallery){
                modal.el.setAttribute('data-gallery',modal.gallery);
                let i = utils.getObjBy(fw.components_active.Modal,'gallery',modal.gallery)?.length - 1 | 0
                modal.galleryIndex = i;
                modal.el.setAttribute('data-gallery-index',i);
                modal.wrapper.append(
                    utils.htmlToNode('<div class="modal__arrow prev"></div>'),
                    utils.htmlToNode('<div class="modal__arrow next"></div>')
                )
            }

            // mutation Observer to track modal's opening and closing
            // modal.observer = new MutationObserver(function(mutations) {
            //     mutations.forEach( function (mutation) {
            //         if (modal.el.open == true)
            //             modal.onOpen();
            //         else{
            //             modal.onClose();
            //             if (modal.autoDestroy) 
            //                 modal.destroy();
            //         }
            //     });
            // });
            // modal.observer.observe(modal.el, {attributes: true, childList: false, characterData: true, subtree:false, attributeFilter: ["open"]});  
            
            modal.el.addEventListener('command',(e)=>{
                this.log('modal command',e.command)
                if (e.command == '--modal-open'){
                    modal.open();
                }
                if (e.command == '--modal-close'){
                    modal.close();
                }
            })

            // Dismiss / closing management
            if (modal.allowDismiss) {
                modal.el.addEventListener('click', function(event) {
                    var rect = modal.contentWrapper.getBoundingClientRect();
                    var isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
                    if (!isInDialog && !event.target.closest('[class*=modal__]')){
                        modal.close();
                    } 
                });
                if (modal.addCloseButton) {
                    if (modal.addCloseButton === true)
                        modal.closeButton = utils.htmlToNode('<span class="close"></span>');
                    else
                        modal.closeButton = utils.htmlToNode(modal.addCloseButton);
                    modal.topButtonsWrapper.prepend(modal.closeButton);
                    modal.closeButton.addEventListener('click',()=>{
                        modal.close();
                    })
                }
                modal.el.addEventListener("cancel", (event) => {
                   event.preventDefault();
                   modal.close();
                })
            } else {
                modal.el.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                    }
                });
            }

            // refresh
            if (modal.addRefreshButton == true){
                modal.refreshButton = utils.htmlToNode('<span class="refresh"></span>');
                modal.topButtonsWrapper.prepend(modal.refreshButton);
                modal.refreshButton.addEventListener('click',()=>{
                    modal.refresh();
                })
            }
            // actions according to parameters
            if (modal.autoLoad){
                modal.setContent().then(()=>{
                    if (modal.trigger)
                        modal.trigger.classList.add('ready');
                });
            } else {
                if (modal.trigger)
                    modal.trigger.classList.add('ready');
            }
            modal.log('onCreate end','',true);
            if (modal.autoOpen)
                modal.open();
        }
        setContent(){
            let modal = this;
            modal.log('setContent')
            return new Promise(function(resolve,reject){
                modal.el.classList.remove('ready');
                // modal.contentWrapper.innerHTML = '';
                while(modal.contentWrapper.firstChild)
                    modal.contentWrapper.removeChild(modal.contentWrapper.lastChild)
                if (modal.title)
                    modal.el.querySelector('.modal__title').innerHTML = modal.title;

                if (modal.url) {
                    // modal.log('has url')
                    if(utils.isImageUrl(modal.url)){
                        // modal.log('is img url')
                        let img = new Image();
                        img.src = modal.url;
                        img.onload = function(){
                            modal.contentWrapper.append(img);
                            modal.el.classList.add('modal--img','ready');
                        };
                        img.onerror = function(){
                            modal.contentWrapper.append(utils.htmlToNode('<p class="block-error">Error: unable to display this image <br>(url: '+modal.url+')</p>'));
                            modal.el.classList.add('ready');
                        };
                        resolve();
                    } else {
                        // modal.log(modal.url)
                        utils.request(modal.url,{}).then(function(r){
                            if (modal.isolateHTML && r.includes('</html>')) {
                                let iframe = utils.appendIsolatedHTML(modal.contentWrapper,r);
                                // modal.open()
                                resolve()
                                return;
                            }
                            let content = utils.htmlToNode(r);
                            if (modal.contentGetSelector) 
                                content = content.querySelector(modal.contentGetSelector) ?? utils.htmlToNode('<span>Content not found</span>');
                            if (modal.contentRemoveSelector) 
                                content = content.querySelectorAll(modal.contentRemoveSelector).forEach((el)=>{el.remove()}) ?? content;

                            modal.contentWrapper.append(content)
                            resolve();
                        })
                    }

                } else if(modal.content != '') {
                    modal.contentWrapper.innerHTML = modal.content;
                    modal.el.classList.add('ready')
                    resolve()
                }
            });
        }
        open(){
            let modal = this;
            modal.log('open')
            for(var m of fw.components_active.Modal)
                if(m.el.open){
                    m.close()
                }
            if (modal.gallery) document.addEventListener('keyup', Modal.galleryKeyboardNav);
            
            if(!modal.autoLoad && !modal.el.classList.contains('ready'))
                modal.setContent();
            modal.el.showModal();
            modal.onOpen();
        }
        close(){
            let modal = this;
            modal.log('close')
            modal.el.close();
            if (modal.gallery) document.removeEventListener('keyup', Modal.galleryKeyboardNav);
            
            Promise.resolve(modal.onClose()).then(()=>{
                if (modal.autoDestroy) 
                    modal.destroy();
            });

        }
        refresh(){
            let modal = this;
            modal.log('refresh');
            modal.setContent().then(()=>{
                modal.el.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
                modal.onRefresh();
            })
        }
    }
    // window.addEventListener("load", function(e) {
    //     document.querySelectorAll('.modal__trigger,[command="--modal-open"]').forEach((el)=>{
    //         Modal.createFromTrigger(el);
    //     })
    // });

    let modalTriggerObserver = new MutationObserver(function(mutations) {
        mutations.forEach( function (mutation) {
            if (typeof mutation.addedNodes == "object") {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType != 1 || node.classList.contains('exclude_component'))
                        return;
                    if (node.classList.contains('modal__trigger') || node.getAttribute('command') == "--modal-open") {
                        Modal.createFromTrigger(node);
                        Modal.prototype.log('A modal trigger has been added to the DOM and initialized',node);
                    }
                })
            }
        });
    });
    modalTriggerObserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

    return Modal;
}
