const SELECTORS = {
    commentsNode: 'div[data-testid="issue.activity.comments-list"]',
    commentButtonNode: 'button[data-testid="issue-activity-feed.ui.buttons.Comments"]',
    loadMoreButton: 'button[data-testid="issue.activity.common.component.load-more-button.loading-button"]',
    internalCommentIcon: 'span[data-vc="icon-undefined"]:not([role="img"]',
    activeSprintIssueDetailModal: 'div[data-component-selector="jira.issue-view.issue-details.modal-dialog-container"]'
}

let hideInternalComments = false

// Inject CSS (so we don't rely on cryptic class names)
function initCSS() {
    let styleTag = document.querySelector('#toggle-internal-comments-style')
    if (!styleTag) {
        styleTag = document.createElement('style')
        styleTag.id = 'toggle-internal-comments-style'
        document.head.appendChild(styleTag)
        styleTag.textContent = `
            button.toggle {
                -webkit-box-align: baseline;
                align-items: baseline;
                box-sizing: border-box;
                display: inline-flex;
                font-weight: 500;
                max-width: 100%;
                position: relative;
                text-align: center;
                cursor: pointer;
                height: 1.71429em;
                line-height: 1.71429em;
                vertical-align: middle;
                width: auto;
                -webkit-box-pack: center;
                justify-content: center;
                background-color: rgba(9, 30, 66, 0.06);
                color: rgb(23, 43, 77) !important;
                border-width: 0px;
                border-radius: 3px;
                text-decoration: none;
                transition: background 0.1s ease-out, box-shadow 0.15s cubic-bezier(0.47, 0.03, 0.49, 1.38);
                white-space: nowrap;
                padding: 0 4px 0 4px;
                outline: none;
                margin: 0 4px 0 4px;            
            }
            button.toggle:hover {
                background-color: rgba(9, 30, 66, 0.14);
            }
            button.toggle.active {
                background-color: rgb(233, 242, 255);
                color: rgb(12, 102, 228) !important;
            }
            html[data-color-mode="dark"] button.toggle {
                background-color: rgba(161, 189, 217, 0.08);
                color: rgb(182, 194, 207) !important;
            }
            html[data-color-mode="dark"] button.toggle:hover {
                background-color: rgba(166, 197, 226, 0.16);
            }
            html[data-color-mode="dark"] button.toggle.active {
                background-color: rgb(28, 43, 65);
                color: rgb(87, 157, 255) !important;
            }
            button.toggle span {
                opacity: 1;
                transition: opacity 0.3s;
                margin: 0px 2px;
                -webkit-box-flex: 1;
                flex-grow: 1;
                flex-shrink: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .hidden-comment {
                display: none !important;
            }
        `
    }
}

// Observe the DOM for the comments node to appear
function observeDOMForComments() {
    const observer = new MutationObserver((mutationsList, observer) => {
        if (document.querySelector(SELECTORS.commentsNode)) {
            setupUI()
            observeCommentsButton()
            observer.disconnect()
        }
    })
    observer.observe(document.body, { childList: true, subtree: true })
}

// Observe the comments button in the activity feed 
// in order to re-apply visitility of restricted comments and add click handlers
function observeCommentsButton() {
    const commentButtonNode = document.querySelector(SELECTORS.commentButtonNode)
    if (!commentButtonNode) return

    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (
                mutation.type === 'attributes' && 
                mutation.attributeName === 'aria-checked' && 
                mutation.target.getAttribute(mutation.attributeName) == 'true'
            ) {
                setTimeout(toggleClickHandler, 500)
                setTimeout(addClickHandlerToLoadMoreButton, 500)
            }
        }
    })
    observer.observe(commentButtonNode, { 
        attributes: true, childList: true, subtree: true 
    })
}

// Watch for URL changes and re-apply the DOM observer
function observeUrl() {
    let url = location.href

    const observer = new MutationObserver(() => {
        if (url !== location.href) {
            url = location.href
            setTimeout(observeDOMForComments, 100)
        }
    })
    observer.observe(document.querySelector('title'), { childList: true })

    document.body.addEventListener('click', () => {
        requestAnimationFrame(() => {
            if (url !== location.href) {
                url = location.href
                setTimeout(observeDOMForComments, 100)
            }
        })
    }, true)
}

// Add click handler to the "Load More" button
function addClickHandlerToLoadMoreButton() {
    const loadMoreBtn = document.querySelector(SELECTORS.loadMoreButton)
    if (loadMoreBtn) {
        loadMoreBtn.onclick = toggleClickHandler
    }
}

// Add the "Toggle Internal Comments" button to the activity feed
function addToggleInternalCommentsButton() {
    const commentButtonNode = document.querySelector(SELECTORS.commentButtonNode)
    if (!commentButtonNode || document.querySelector('button.toggle')) return

    const span = document.createElement('span')
    span.innerText = `${!hideInternalComments ? 'Hide' : 'Show'} Restricted Comments`
    const button = document.createElement('button')
    button.role = 'menuitemradio'
    button.className = 'toggle'
    button.appendChild(span)
    button.onclick = toggleInternalComments

    commentButtonNode.parentNode.insertBefore(button, commentButtonNode.nextSibling)
    commentButtonNode.onclick = toggleClickHandler
}

// Toggle the visibility of internal comments
function toggleInternalComments() {
    const commentsNode = document.querySelector(SELECTORS.commentsNode)
    if (!commentsNode) return

    hideInternalComments = !hideInternalComments

    try {
        localStorage.setItem('hideRestrictedComments', hideInternalComments)
    } catch (e) { 
        console.error('Failed to save setting to localStorage') 
    }

    const span = document.querySelector('button.toggle > span')
    if (span) {
        span.innerText = `${!hideInternalComments ? 'Hide' : 'Show'} Restricted Comments`
        span.parentElement.classList.toggle('active', hideInternalComments)
    }

    const internalComments = commentsNode.querySelectorAll(SELECTORS.internalCommentIcon)
    internalComments.forEach(comment => {
        const mainCommentNode = findCommentMainNode(comment)
        if (mainCommentNode) {
            mainCommentNode.classList.toggle('hidden-comment', hideInternalComments)
        }
    })
}

// Find (and return) the main comment node
function findCommentMainNode(node) {
    while (node) {
        if (node?.getAttribute(`data-testid`)?.startsWith('comment-base-item-')) {
            return node.parentNode
        }
        node = node.parentNode
    }

    return null
}

function toggleClickHandler() {
    if (hideInternalComments) {
        setTimeout(toggleInternalComments, 500)
        setTimeout(toggleInternalComments, 505)
    }  
}

function setupUI() {
    addToggleInternalCommentsButton()
    setTimeout(addClickHandlerToLoadMoreButton, 500)

    try {
        hideInternalComments = localStorage.getItem('hideRestrictedComments') !== 'true'
        toggleInternalComments()
    } catch (e) {
        console.error('Failed to load setting from localStorage')
    }
}

function init() {
    initCSS()
    const commentsNode = document.querySelector(SELECTORS.commentsNode)
    if (!commentsNode) {
        setTimeout(observeDOMForComments, 500)
    } else {
        setupUI()
    }
    observeUrl()
}

init()
