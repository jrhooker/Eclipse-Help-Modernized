/*******************************************************************************
 * Copyright (c) 2019 Holger Voormann and others.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ******************************************************************************/

var menuWidth = 280; // Right side menu width
var SMALL_SCREEN_WIDTH = 768;
var TOC_DEFAULT_WIDTH = 360;
var TOC_MIN_WIDTH = 64;
var TOC_SLIDER_WIDTH = 12;
var tocWidth = TOC_DEFAULT_WIDTH;
var isEmbeddedHelp = false;

var QUERY_PREFIX = 'rtopic/de.agilantis.help_ui_modernized/m_search.html?searchWord=';
var QUERY_PREFIX_LENGTH = QUERY_PREFIX.length;

function h(a, c, d, e) {
    if (typeof _eh != 'undefined')
        _eh.h(a, '', true, d, c, e)
};
function v(a, c, d, e) {
    if (typeof _eh != 'undefined')
        _eh.h(a, 's', true, d, c, e)
};
function addEvent(o, type, fn) {
    if (o.addEventListener)
        o.addEventListener(type, fn, false);
    else if (o.attachEvent) {
        o['e' + type + fn] = fn;
        o[type + fn] = function() {
            o['e' + type + fn](window.event);
        }
        o.attachEvent('on' + type, o[type + fn]);
    }
}
function toggleToc(initToc) {
    var tocSidebar = document.getElementById('m-aside');
    var currentClass = tocSidebar.getAttribute('class');
    var clientWidth = document.documentElement.clientWidth || document.body.clientWidth;
    var hideToc = currentClass ? currentClass == 'show' || currentClass == 'showm' : clientWidth > SMALL_SCREEN_WIDTH;
    var isMinimized = currentClass == 'm' || currentClass == 'showm';
    if (initToc) {
        tocWidth = getCookie('toc-width');
        if (tocWidth && tocWidth.charAt(0) == 'l') {
            isMinimized = true;
            tocWidth = Number(tocWidth.substring(1));
        }
        hideToc = (clientWidth <= SMALL_SCREEN_WIDTH) || (tocWidth && tocWidth < 0);
        if (!tocWidth) tocWidth = TOC_DEFAULT_WIDTH;
        tocSidebar.style.width = isMinimized ? TOC_SLIDER_WIDTH : (tocWidth < 0 ? -tocWidth : tocWidth) + 'px';
    }
    var newClass = clientWidth > SMALL_SCREEN_WIDTH
                   ? (hideToc ? (isMinimized ? 'm' : 'hide') : '')
                   : (hideToc ? '' : 'show') + (isMinimized ? 'm' : '');
    tocSidebar.setAttribute('class', newClass);
    if ((hideToc && tocWidth > 0) || (!hideToc && tocWidth < 0)) {
        tocWidth = -tocWidth;
        if (clientWidth > SMALL_SCREEN_WIDTH) storeTocWidth();
    }
    if (isMinimized) tocSidebar.style.width = (hideToc ? TOC_SLIDER_WIDTH : tocWidth) + 'px';
}
function storeTocWidth() {
    var currentClass = document.getElementById('m-aside').getAttribute('class');
    setCookie('toc-width', (currentClass == 'm' || currentClass == 'showm' ? 'l' : '') + tocWidth, 365);
}
function updateContentFrameSize() {
    if (!scrollPageMode) return;

    // see https://stackoverflow.com/a/49261999 and https://stackoverflow.com/a/819455
    var contentFrame = document.getElementById('m-content');
    var contentFrameDocument = contentFrame.contentWindow.document;
    var contentFrameDocumentElement = contentFrameDocument.documentElement
            || contentFrameDocument.body;
    var magic = 1;

    // start with 0x0 (otherwise issues in Chrome)
    contentFrame.width = '0';
    contentFrame.height = '0';

    // available/required width
    // var innerWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    var clientWidth = document.documentElement.clientWidth
            || document.body.clientWidth;
    var widthAvailable = clientWidth - tocWidth - magic;
    var widthMinRequired = contentFrameDocumentElement.scrollWidth;
    contentFrame.width = (widthMinRequired > widthAvailable ? widthMinRequired
            : widthAvailable)
            + 'px';
    contentFrame.height = contentFrameDocumentElement.scrollHeight + 'px';

    // with vertical scrollbar less space is available
    var newClientWidth = document.documentElement.clientWidth
            || document.body.clientWidth;
    if (newClientWidth < clientWidth) {
        widthAvailable = newClientWidth - tocWidth - magic;
        contentFrame.width = (widthMinRequired > widthAvailable ? widthMinRequired
                : widthAvailable)
                + 'px';
        contentFrame.height = contentFrameDocumentElement.scrollHeight + 'px';
    }

    // TODO make sure that the following hack is not required in Firefox to recalculate total page height:
    //setTimeout(function() { document.getElementById('m-aside').style.display = 'none';
    //setTimeout(function() { document.getElementById('m-aside').style.display = 'table-cell'; }, 1); }, 1);

}
function initContentFrame() {
    updateDeepLink();

    // scroll mode
    var scroll = 'scroll-areas';
    if ('scroll-areas' == scroll) {
        scrollPageMode = false;
        document.getElementsByTagName('body')[0].setAttribute('class', scroll);
    } else {
        document.getElementById('m-content').scrolling = 'no';
        updateContentFrameSize();
    }
    addEvent(window, 'resize', updateContentFrameSize);
    // Set cursor in search field
    document.getElementById('focusByDefault').focus();
}
function updateDeepLink() {
    function removeHash() {
        try {
            window.history.replaceState(null, '', window.location.href.replace(/^([^#\?]*(?:\?([^#\?]*))?)(#.*)?$/, '$1'));
        } catch(e) {}
    }
    try {
        var link = document.createElement('a');
        link.href = (window.INTEGRATED ? '' : '../../') + 'x';
        var base = link.href.substring(0, link.href.length - 1);
        var src = document.getElementById('m-content').contentDocument.location.href;
        if (base != src.substring(0, base.length)) return;
        var current = src.substring(base.length);
        if (   'nav/' == current.substring(0, 4)
            || 'topic/' == current.substring(0, 6)
            || 'rtopic/' == current.substring(0, 7)
            || 'ntopic/' == current.substring(0, 7)
            || 'nftopic/' == current.substring(0, 8)) {
            if (current.length > QUERY_PREFIX_LENGTH && QUERY_PREFIX == current.substring(0, QUERY_PREFIX_LENGTH)) {
                current = 'q=' + current.substring(QUERY_PREFIX_LENGTH);
            }
            window.history.replaceState(null, '', '#' + current);
        } else removeHash();
    } catch(e) {
        removeHash();
    }
}
function initSearchField() {
    var callbackFn = function(responseText) {
        var nodes = getNodes(parseXml(responseText));
        var firstId;
        var tocs = [];
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (n.tagName != 'node')
                continue;
            var title = n.getAttribute('title');
            var id = n.getAttribute('id');
            var href = n.getAttribute('href');
            if (!firstId)
                firstId = id;
            tocs.push(title ? title : '');
            tocs.push(id ? id : '');
            tocs.push(href ? href : '');
        }
        _eh.e(document.getElementById('f'), tocs, firstId, true, 10,
                function shortenBookName(bookName) {
                    return bookName.replace(
                            /\s+(Documentation\s*)?(\-\s+([0-9,\-]+\s+)?Preview(\s+[0-9,\-]+)?\s*)?$/i,
                            '')
                });
    }
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200)
            callbackFn(request.responseText);
    }
    request.open('GET', (window.INTEGRATED ? '' : '../../') + 'advanced/tocfragment');
    request.send();
};

function remoteRequest(url, callbackFn) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200)
            callbackFn(request.responseText);
    }
    request.open('GET', url);
    request.send();
    if (openRequest && openRequest.abort)
        openRequest.abort();
    if (!uncancelable)
        openRequest = request;
}

var parseXml;
if (typeof window.DOMParser != "undefined") {
    parseXml = function(xmlStr) {
        return (new window.DOMParser()).parseFromString(xmlStr, "text/xml");
    };
} else if (typeof window.ActiveXObject != "undefined"
        && new window.ActiveXObject("Microsoft.XMLDOM")) {
    parseXml = function(xmlStr) {
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(xmlStr);
        return xmlDoc;
    };
}

var scrollPageMode = false;
function init() {

    // init TOC width (cookie: 'toc-width')
    toggleToc(true);

    setContentPageAndLoadToc();

    // activate slider (to resize TOC width)
    var slider = document.getElementById("m-slider");
    var asideStyle = document.getElementById("m-aside").style;

    // initial load
    asideStyle.transition = '';
    asideStyle.width = tocWidth + 'px';

    slider.mousemove = function(e) {
        tocWidth = e.pageX + 8;
        if (tocWidth < TOC_SLIDER_WIDTH) tocWidth = TOC_SLIDER_WIDTH;
        asideStyle.transition = '';
        asideStyle.width = tocWidth + 'px';
        updateContentFrameSize();
    };
    slider.onmousedown = function(e) {
        try {
            document.getElementById("m-ovrl").style.display = 'block';
            document.documentElement.addEventListener('mousemove', slider.doDrag, false);
            document.documentElement.addEventListener('mouseup', slider.stopDrag, false);
        } catch (e) {
        }
    }
    slider.doDrag = function(e) {
        if (e.which != 1) {
            slider.stopDrag(e);
            return;
        }
        slider.mousemove(e);
    }
    slider.stopDrag = function(e) {
        if (tocWidth >= 0 && tocWidth < TOC_MIN_WIDTH) {
            var oldWidth = getCookie('toc-width');
            if (oldWidth && oldWidth.charAt(0) == 'l') oldWidth = Number(tocWidth.substring(1));
            tocWidth = oldWidth ? oldWidth : TOC_DEFAULT_WIDTH;
            toggle_toc();
        } else {
            document.getElementById('m-aside').setAttribute('class', tocWidth < 0 ? 'm' : '');
            storeTocWidth();
        }
        document.getElementById("m-ovrl").style.display = 'none';
        document.documentElement.removeEventListener('mousemove', slider.doDrag, false);
        document.documentElement.removeEventListener('mouseup', slider.stopDrag, false);
        updateContentFrameSize();
    }
    function toggle_toc() {
        tocWidth = -tocWidth;
        var aside = document.getElementById('m-aside');
        aside.setAttribute('class', tocWidth < 0 ? 'm' : '');
        aside.style.transition = 'width .25s ease-in';
        aside.style.width = (tocWidth < TOC_SLIDER_WIDTH ? TOC_SLIDER_WIDTH : tocWidth) + 'px';
        updateContentFrameSize();
        storeTocWidth();
    }
    addEvent(slider, 'dblclick', toggle_toc);
    addEvent(document.getElementById('m-slider_'), 'click', toggle_toc);

    scrollToTop();

    // read font size from cookie if already set
    var fontSize = getFontSize();
    if (fontSize) setFontSize(fontSize);

    addEvent(document.getElementById('m-content'), 'load', syncToc);

    addEvent(document.getElementById('m-content'), 'load', scrollToTop);

    // init "Highlight search terms" menu
    var enableHighlighting = 'false' != getCookie('highlight');
    if (enableHighlighting) {
        var highlightStyle = document.getElementById('h-toggle-highlight').style;
        highlightStyle.backgroundColor = '#FFFF66';
        highlightStyle.fontWeight      = 'bold';
    }

}
function setContentPageAndLoadToc() {

    // by hash
    var hash = window.location.hash;
    try {
        if (hash && (   'q=' == hash.substring(1, 3)
                     || 'nav/' == hash.substring(1, 5)
                     || 'topic/' == hash.substring(1, 7)
                     || 'rtopic/' == hash.substring(1, 8)
                     || 'ntopic/' == hash.substring(1, 8)
                     || 'nftopic/' == hash.substring(1, 9))) {
            loadTocChildrenInit(document.getElementById('m-toc'));
            document.getElementById('m-content').src =   (window.INTEGRATED ? '' : '../../')
                                                       + 'q=' == hash.substring(1, 3)
                                                         ? QUERY_PREFIX + hash.substring(3)
                                                         : hash.substring(1);
            return;
        }
    } catch(e) {}

    // by legacy query parameters topic/nav
    var params = {};
    var queryPart = window.location.href.replace(/^[^#\?]*(?:\?([^#\?]*))?(#.*)?$/, '$1');
    queryPart.replace(/(?:^|&+)([^=&]+)=([^&]*)/gi, function(m, param, value) { params[param] = decodeURIComponent(value); });
    var topicOrNav = params.topic || params.nav;
    if (topicOrNav) {
        loadTocChildrenInit(document.getElementById('m-toc'));
        document.getElementById('m-content').src =   (window.INTEGRATED ? (params.nav ? 'nav' : 'topic') : '../..')
                                                   + topicOrNav
                                                   + (params.anchor ? '#' + params.anchor : '');
        return
    }

    // default start/cover page
    var callbackFn = function(responseText) {
        var start = responseText.indexOf('title="Topic View" src=\'');
        if (start > 0) {
            var end = responseText.indexOf("'", start + 24);
            var element = createElement(null, 'p');
            element.innerHTML = responseText.substring(start + 24, end);
            document.getElementById('m-content').src =   (window.INTEGRATED ? 'topic/' : '../')
                                                       + (element.textContent ? element.textContent : element.innerText);
            loadTocChildrenInit(document.getElementById('m-toc'));
        }
    }
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) callbackFn(request.responseText);
    }
    request.open('GET', (window.INTEGRATED ? '' : '../../') + 'advanced/content.jsp');
    request.send();

}

var syncedTocItem;
var syncedTocItemPath = [];
var syncedTocItemLocation;
var syncedTocItemLocationByTocClick;
function syncToc() {
    var isTocClick = syncedTocItemLocationByTocClick;
    syncedTocItemLocationByTocClick = false;
    var currentLocation;
    try {
        currentLocation = normalizeHref(document.getElementById('m-content').contentWindow.location.href);
    } catch(e) {}
    if (syncedTocItemLocation && syncedTocItemLocation == currentLocation) return;
    if (syncedTocItem) {
        syncedTocItem.setAttribute('class', syncedTocItem.getAttribute('class').replace(' selected', ''));
    }
    syncedTocItem = false;
    for (var i = 0; i < syncedTocItemPath.length; i++) {
        syncedTocItemPath[i].setAttribute('class', syncedTocItemPath[i].getAttribute('class').replace(' selected-p', ''));
    }
    syncedTocItemPath = [];
    syncedTocItemLocation = currentLocation;
    if (!currentLocation) return;
    var todo = [[], document.getElementById('m-toc').childNodes];
    findTocItem: while (todo.length > 1) {
        var parents = todo[todo.length - 2];
        var children = todo[todo.length - 1];
        todo = todo.slice(0, todo.length - 2);
        for (var i = 0; i < children.length; i++) {
            var n = children[i];
            if (n.tagName != 'UL' && n.tagName != 'LI') continue;
            var newParents = parents.slice(0, parents.length);
            newParents.push(n);
            todo.push(newParents);
            todo.push(n.childNodes);
            if (n.tagName != 'LI') continue;
            for (var j = 0; j < n.childNodes.length; j++) {
                var m = n.childNodes[j];
                if (m.tagName == 'A' && currentLocation == normalizeHref(m.href)) {
                    setAsSynced(n, isTocClick);
                    return;
                }
            }
        }
    }
    var callbackFn = function(responseText) {
        syncTocByLocation(currentLocation, parseXml(responseText), isTocClick);
    }
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) callbackFn(request.responseText);
    }
    request.open('GET', (window.INTEGRATED ? '' : '../../') + 'advanced/tocfragment?errorSuppress=true&topic=' + currentLocation);
    request.send();
}
function normalizeHref(href) {
    if (!href) return href;
    var result = href.replace('/ntopic/', '/topic/');
    var queryStart = result.indexOf('?');
    return queryStart > 0 ? result.substring(0, queryStart) : result;
}
function syncTocByLocation(location, xml, isTocClick) {
    var children = xml.documentElement.childNodes;
    var numericPath;
    for (var i = 0; i < children.length; i++) {
        var n = children[i];
        if (n.tagName == 'numeric_path' && n.getAttribute('path')) {
            numericPath = n.getAttribute('path');
            break;
        }
    }
    if (!numericPath) return;
    var callbackFn = function(responseText) {
        syncTocByPath(location, numericPath, parseXml(responseText), isTocClick);
    }
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) callbackFn(request.responseText);
    }
    request.open('GET', (window.INTEGRATED ? '' : '../../') + 'advanced/tocfragment?errorSuppress=true&expandPath=' + numericPath);
    request.send();
}
function syncTocByPath(location, numericPath, xml, isTocClick) {
    var path = numericPath.split('_');
    var nodes = xml.documentElement.childNodes;
    var item = document.getElementById('m-toc');
    var toc;
    for (var i = 0; i < path.length; i++) {
        var nr = parseInt(path[i]);
        var node = getNodeNr(nodes, i < 1 ? 0 : nr);
        if (!node) return;
        if (i < 1) toc = node.getAttribute('id');
        var ul = getUl(item);
        if (!ul && toc) {
            showLoadedTocChildren(item, nodes, toc);
            ul = getUl(item);
        }
        if (!ul) return;
        nodes = node.childNodes;
        var item = getLiNr(ul, nr);
        if (i < path.length-1) continue;
        setAsSynced(item, isTocClick);
    }
}
function setAsSynced(item, isTocClick) {
    syncedTocItem = item;
    syncedTocItem.setAttribute('class', syncedTocItem.getAttribute('class') + ' selected');
    markTocPath(syncedTocItem, !isTocClick);
    scrollIntoViewIfNeeded(syncedTocItem);
}
function markTocPath(syncedTocItem, closeSiblings) {
    for (var li = syncedTocItem; li.tagName == 'LI'; li = li.parentElement.parentElement) {
        if (li !== syncedTocItem) {
            li.setAttribute('class', li.getAttribute('class').replace('closed', 'open') + ' selected-p');
            syncedTocItemPath.push(li);
        }
        if (li.parentElement.parentElement.tagName != 'LI') {
            for (var i = 0; i < li.childNodes.length; i++) {
                var n = li.childNodes[i];
                if (n.tagName != 'A') continue;
                if (window.setBook) window.setBook(n.href);
                break;
            }
        }
        if (!closeSiblings) continue;
        var ul = li.parentElement;
        for (var i = 0; i < ul.childNodes.length; i++) {
            var n = ul.childNodes[i];
            if (li !== n) n.className = n.className.replace('open', 'closed');
        }
    }
}
function scrollIntoViewIfNeeded(syncedTocItem) {
    try {
        if ('scroll-areas' != document.getElementsByTagName('body')[0].className) return;
        if (!syncedTocItem.getBoundingClientRect) syncedTocItem.scrollIntoView(true);
        for (var i = 0; i < syncedTocItem.childNodes.length; i++) {
            var node = syncedTocItem.childNodes[i];
            if (node.tagName != 'A') continue;
            var tocElement = document.getElementById('m-aside');
            var tocBoundaries = tocElement.getBoundingClientRect();
            var itemBoundaries = node.getBoundingClientRect();
            if (itemBoundaries.top >= tocBoundaries.top && itemBoundaries.bottom <= tocBoundaries.bottom) return;
            tocElement.scrollTop += itemBoundaries.bottom <= tocBoundaries.bottom
                                    ? itemBoundaries.top - tocBoundaries.top
                                    : itemBoundaries.bottom - tocBoundaries.bottom;
            return;
        }
    } catch (e) {}
}
function getNodeNr(nodes, nr) {
    var count = -1;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].tagName != 'node') continue;
        count++;
        if (nr == count) return nodes[i];
    }
}
function getUl(item) {
    for (var i = 0; i < item.childNodes.length; i++) {
        if (item.childNodes[i].tagName == 'UL') return item.childNodes[i];
    }
}
function getLiNr(ul, nr) {
    var count = -1;
    for (var i = 0; i < ul.childNodes.length; i++) {
        if (ul.childNodes[i].tagName != 'LI') continue;
        count++;
        if (nr == count) return ul.childNodes[i];
    }
}

// TODO remove when integrated into Eclipse
// (the following function is only required to support older Eclipse versions having GIF instead of SVG icons)
var iconExtension = '.svg';

function loadTocChildrenInit(item, toc, path) {
    var callbackFn = function(responseText) {
        if (responseText.indexOf('e_contents_view.gif') > 0) iconExtension = '.gif';

        // show history buttons in embedded help, but not in Infocenter mode
        if (responseText.indexOf('e_bookmarks_view.') > 0) {
            var ids = ['h-history-back-icon', 'h-history-back-btn', 'h-history-forward-icon', 'h-history-forward-btn'];
            for (var i = 0; i < ids.length; i++) document.getElementById(ids[i]).style.display = 'inline-block';
        }

        loadTocChildren(item, toc, path);
    }
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200)
            callbackFn(request.responseText);
    }
    request.open('GET', (window.INTEGRATED ? '' : '../../') + 'advanced/tabs.jsp');
    request.send();
}

function loadTocChildren(item, toc, path) {
    var callbackFn = function(responseText) {
        showLoadedTocChildren(item, getNodes(parseXml(responseText), toc, path), toc);
    }
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200)
            callbackFn(request.responseText);
    }
    request.open('GET', (window.INTEGRATED ? '' : '../../') + 'advanced/tocfragment' + (toc ? '?toc=' + toc : '') + (path ? '&path=' + path : ''));
    request.send();
}

function createElement(parent, name, clazz, text) {
    var element = document.createElement(name);
    if (parent) {
        parent.appendChild(element);
    }
    if (clazz) {
        element.setAttribute('class', clazz);
    }
    if (text) {
        element.appendChild(document.createTextNode(text));
    }
    return element;
}

function getNodes(xml, toc, path) {
    var books = xml.documentElement.childNodes;
    if (!toc)
        return books;
    var book;
    for (var i = 0; i < books.length; i++) {
        book = books[i];
        if (book.tagName == 'node' && toc == book.getAttribute('id')) {
            if (!path)
                return book.childNodes;
            break;
        }
    }
    var nodes = book.childNodes;
    tocLevelLoop: while (true) {
        for (var i = 0; i < nodes.length; i++) {
            n = nodes[i];
            if (n.tagName != 'node')
                continue;
            var id = n.getAttribute('id');
            if (path == id)
                return n.childNodes;
            if (id && path.length > id.length
                    && path.substring(0, id.length + 1) == id + '_') {
                nodes = n.childNodes;
                continue tocLevelLoop;
            }
        }
        break;
    }
    return [];
}

function showLoadedTocChildren(item, nodes, toc) {
    var ul = createElement(item, 'ul');
    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.tagName != 'node')
            continue;
        var li = createElement(ul, 'li', 'closed');
        if (n.getAttribute('is_leaf') != 'true') {
            var handle = createElement(li, 'span');
            handle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" focusable="false" role="presentation">-<path d="M10.294 9.698a.988.988 0 0 1 0-1.407 1.01 1.01 0 0 1 1.419 0l2.965 2.94a1.09 1.09 0 0 1 0 1.548l-2.955 2.93a1.01 1.01 0 0 1-1.42 0 .988.988 0 0 1 0-1.407l2.318-2.297-2.327-2.307z" fill="currentColor" fill-rule="evenodd"></path></svg>';
            addEvent(handle, 'click', (function(li, toc, path) {
                return function() {
                    toggleTocItem(li, toc, path)
                };
            })(li, toc ? toc : n.getAttribute('id'), toc ? n.getAttribute('id') : undefined));
        }
        var a = createElement(li, 'a');
        a.setAttribute('href', (window.INTEGRATED ? '' : '../../') + n.getAttribute('href').substring(3));
        a.setAttribute('target', 'm-content');
        addEvent(a, 'click', function() {
            var clientWidth = document.documentElement.clientWidth || document.body.clientWidth;
            if (clientWidth < SMALL_SCREEN_WIDTH) toggleToc();
            syncedTocItemLocationByTocClick = true;
        });
        var icon = n.getAttribute('image');
        if (icon) {
            var iconImg = createElement(a, 'img');
            iconImg.setAttribute('src', (window.INTEGRATED ? '' : '../../') + 'advanced/images/' + icon
                    + iconExtension);
        }
        a.appendChild(document.createTextNode(n.getAttribute('title')));
    }
    updateContentFrameSize();
}
function toggleTocItem(li, toc, path) {
    var isOpen = li.getAttribute('class').indexOf('open') > -1;
    li.setAttribute('class', li.getAttribute('class').replace(isOpen ? 'open' : 'closed', isOpen ? 'closed' : 'open'));
    var nodes = li.childNodes;
    for (var i = 0; i < nodes.length; i++) if (nodes[i].tagName == 'UL') return;
    loadTocChildren(li, toc, path);
}

// Prints current loaded topic
function printContent() {
    try {
        var c = document.getElementById('m-content');
        var ot = document.title;
        document.title = c.contentDocument.title;
        c.contentWindow.print();
        // Reset the title again to the original value
        document.title = ot;
    } catch (e) {
    }
}

function printSection() {
    var contentElement = document.getElementById('m-content');
    var contentWindow = contentElement.contentWindow;
    var topicHref = contentWindow.location.href;
    if (!topicHref) return;
    var dummy = document.createElement('a');
    dummy.href = (window.INTEGRATED ? '' : '../../') + 'x';
    var topic = topicHref.substring(dummy.href.length - 2);
    if (topic.length > 7 && '/topic/' == topic.substring(0, 7)) topic = topic.substring(6);
    else if (topic.length > 5 && '/nav/' == topic.substring(0, 5)) topic = '/..' + topic;
    else if (topic.length > 8 && ('/rtopic/' == topic.substring(0, 8) || '/ntopic/' == topic.substring(0, 8))) topic = topic.substring(7);
    var w = contentWindow.innerWidth || contentWindow.document.body.clientWidth;
    var h = contentWindow.innerHeight || contentWindow.document.body.clientHeight;
    var element = contentElement;
    var x = window.screenX;
    var y = window.screenY;
    for (var e = contentElement; !!e; e = e.offsetParent) {
        if (e.tagName == "BODY") {
            var xScroll = e.scrollLeft || document.documentElement.scrollLeft;
            var yScroll = e.scrollTop || document.documentElement.scrollTop;
            x += (e.offsetLeft - xScroll + e.clientLeft);
            y += (e.offsetTop  - yScroll + e.clientTop);
        } else {
            x += (e.offsetLeft - e.scrollLeft + e.clientLeft);
            y += (e.offsetTop  - e.scrollTop  + e.clientTop);
        }
    }
    var anchor = '';
    var anchorStart = topic.indexOf('#');
    if (anchorStart > 0) {
        anchor = '&anchor=' + topic.substr(anchorStart + 1);
        topic = topic.substr(0, anchorStart);
    }
    var query = '';
    var queryStart = topic.indexOf('?');
    if (queryStart > 0) {
        query = '&' + topic.substr(queryStart + 1);
        topic = topic.substr(0, queryStart);
    }
    window.open((window.INTEGRATED ? '' : '../../') + 'advanced/print.jsp?topic=' + topic + query + anchor, 'printWindow', 'directories=yes,location=no,menubar=yes,resizable=yes,scrollbars=yes,status=yes,titlebar=yes,toolbar=yes,width=' + w + ',height=' + h + ',left=' + x + ',top=' + y);
}

// Opens requested topic in content frame
function openTopic(topic) {
    var a = document.createElement('a');
    a.href = topic;
    a.target = 'm-content';
    document.body.appendChild(a);
    a.click();
}

// Opens more menu
function openMenu() {
    document.getElementById("h-menu-ovrl").style.width = menuWidth + 'px';
}
// Closes more menu
function closeMenu() {
    document.getElementById("h-menu-ovrl").style.width = '0px';
}

// Closes menu if the user clicks outside of it

// TODO Close menu also when content iframe is clicked
//var contentFrame = document.getElementById('m-content');
//var contentFrameDocument = contentFrame.contentWindow.document;
//contentFrameDocument.addEventListener('click', function(event) {closeMenu(this.id);}, false);

window.onclick = function(event) {
    //console.log("event.target.id=" + event.target.id);
    if (event.target.id != 'h-more-btn' && event.target.id != 'h-more-icon'
            && event.target.id != 'h-menu-close-btn'
            && event.target.id != 'h-menu-settings-font-btn'
    //&& event.target.id != 'h-toc-btn'
    ) {
        document.getElementById("h-menu-ovrl").style.width = '0px';
        //document.getElementById("m-aside").style.width = '0px';
    }
}

// Closes table of contents
function closeToc() {
    var masideStyle = document.getElementById("m-aside").style;
    masideStyle.width = '0px';
    if (clientWidth < SMALL_SCREEN_WIDTH && tocWidth > TOC_SLIDER_WIDTH) {
        tocWidth = -tocWidth;
    }
    updateContentFrameSize();
}

// Sets cursor in search field
function focusSearch() {
    document.getElementById('focusByDefault').focus();
}

// Go one page back in browser history
// (required in standalone help viewer only)
function goBack() {
    window.history.back();
}

// Go one page forward in browser history
// (required in standalone help viewer only)
function goForward() {
    window.history.forward();
}

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {
    scrollFunction()
};

function scrollFunction() {

    // Initialize go to top button
    var topButton = document.getElementById("f-totop");

    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        topButton.style.display = "block";
    } else {
        topButton.style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function scrollToTop() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

// From the TOC scroll to the heading of the topic
function scrollToHeading() {
    var content = document.getElementById('m-content');
    location.href = "#ariaid-title1";
}

// In-Decrease the font size for the toc and content iframe
function setFontSize(change) {
    var fontChange = 3;
    var newFontSize = 0;
    var contentFrame = document.getElementById('m-content');
    var contentFrameDocument = contentFrame.contentWindow.document;
    var contentFrameDocumentElement = contentFrameDocument.documentElement
            || contentFrameDocument.body;
    var contentStyle = window.getComputedStyle(contentFrameDocumentElement,
            null).getPropertyValue('font-size');
    var contentFontSize = parseFloat(contentStyle);
    var toc = document.getElementById('m-toc');
    var tocStyle = getComputedStyle(toc, null).getPropertyValue('font-size');
    var tocFontSize = parseFloat(tocStyle);

    if (change == 'plus') {
        newFontSize = (tocFontSize + fontChange);
    } else if (change == 'minus' && tocFontSize > 12) {
        newFontSize = (tocFontSize - fontChange);
    } else if (change != '') { // value from cookie
        newFontSize = change;
    } else {
        return null;
    }

    contentFrameDocumentElement.style.fontSize = newFontSize + 'px';
    toc.style.fontSize = newFontSize + 'px';

    // Store the font size in a cookie
    setCookie("font-size", newFontSize, 365);
}

function getFontSize() {
    return getCookie("font-size");
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return undefined;
}

function HighlightConnector() {};
HighlightConnector.prototype.setButtonState = function(name, state) {
    // dummy for highlight() in org.eclipse.help.webapp/advanced/highlight.js
};
var ContentToolbarFrame = new HighlightConnector();
function toggleHighlight() {
    var highlightStyle = document.getElementById('h-toggle-highlight').style;
    var enableHighlighting = 'false' == getCookie('highlight');
    highlightStyle.backgroundColor = enableHighlighting ? '#ffff66' : '';
    highlightStyle.fontWeight      = enableHighlighting ? 'bold' : 'normal';
    setCookie('highlight', enableHighlighting ? 'true' : 'false', 365);
    var contentFrameWindow = document.getElementById('m-content').contentWindow;
    if (contentFrameWindow && contentFrameWindow.highlight && contentFrameWindow.toggleHighlight) {
        contentFrameWindow.toggleHighlight();
        contentFrameWindow.highlight();
    }
}
