/**
 * Utilities
 */
function createElementFromHtml(html) {
    var template = document.createElement('template');
    var html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

/**
 * Class representing a ListItem
 */
class ListItem {

    /**
     * Create a ListItem
     * @param {string} text
     */
    constructor(text) {
        // randomly generate a ID
        this.id = '_' + Math.random().toString(36).substr(2, 9);

        this.text = text;
        this.state = "active";
        this.checked = false;
    }

    /**
     * Toggle ListItem state
     */
    setChecked() {
        this.checked = true;
    }
    setNotChecked() {
        this.checked = false;
    }

    dump() {
        return {
            "id": this.id,
            "text": this.text,
            "state": this.state,
            "checked": this.checked
        }
    }
}

/**
 * Class representing the entire Todo List
 */
class TodoList {

    /**
     * Create a TodoList
     *
     * @param {Element} ul - DOM element for the parent unordered list
     * @param {Element} btnGroup - DOM element for the Bulk Action buttons
     */
    constructor(ul, btnGroup) {
        this.ul = ul;
        this.listItems = [];

        // if we've already saved state in localStorage,
        // let's recreate the List from there
        var storageList = localStorage.getItem("MinimalList");
        if (storageList) {
            this.createFromLocalStorage(storageList);
        }

        // shortcuts to Bulk Action buttons
        this.btnSelectAll = btnGroup.getElementsByClassName("bulk-select-all")[0];
        this.btnDeselectAll = btnGroup.getElementsByClassName("bulk-deselect-all")[0];
        this.btnMarkComplete = btnGroup.getElementsByClassName("bulk-mark-complete")[0];
        this.btnDeleteSelected = btnGroup.getElementsByClassName("bulk-delete-selected")[0];

        this.computeButtonState();
    }

    createFromLocalStorage(storageList) {
        var parsedList = JSON.parse(storageList);
        parsedList.forEach(item => {
            if (item.state === "active") {
                this.addListItem(item.text);
            } else if (item.state === "disabled") {
                var ListItem = this.addListItem(item.text);
                this.completeListItem(ListItem.id);
            }
        });
    }


    /**
     * Helpers to maniupate List Item state
     */
    _addListItem(item) {
        this.listItems.push(item);
    }

    _completeListItem(id) {
        var listItem = this._getListItem(id);
        listItem.state = "disabled";
    }

    _deleteListItem(id) {
        this.listItems = this.listItems.filter(function(item) {
            return item.id !== id;
        });
    }

    _getListItem(id) {
        var listItems = this.listItems.filter(function(item) {
            return item.id === id;
        });
        return listItems[0];
    }

    _getCheckedItems() {
        var listItems = this.listItems.filter(function(item) {
            return item.checked === true && item.state !== "deleted";
        });
        return listItems;
    }

    _updateListItem(id, newText) {
        this.listItems.forEach(item => {
            if (item.id === id) {
                item.text = newText;
            }
        });
    }

    /**
     * Methods for List Item CRUD operations
     */
    addListItem(text) {
        var listItem = new ListItem(text);
        this._addListItem(listItem);

        var li = 
            `<li id=${listItem.id} class="flex justify-between items-center h-16 w-full border-b border-b-2 border-teal-500 hover:bg-blue-200"
                ondblclick="todoList.editListItem(this.id)">
                <div class="flex-initial px-2 mb-1 ml-1">
                    <input class="list-item-check" type="checkbox" onclick="todoList.toggleCheck(this.parentElement.parentElement.id)">
                    <label></label>
                </div>
                <div class="list-item-text flex-auto px-2 text-lg text-gray-700">
                    ${listItem.text}
                </div>
                <div class="item-check flex-initial p-1 m-1" onclick="todoList.completeListItem(this.parentElement.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20pt" height="16pt" viewBox="0 0 24 20" version="1.1">
                        <g id="surface1">
                        <path style="fill:none;stroke-width:14;stroke-linecap:butt;stroke-linejoin:miter;stroke:rgb(0%,80%,0%);stroke-opacity:1;stroke-miterlimit:4;" d="M 19.990234 130 L 60.008138 170 L 200.014648 30 " transform="matrix(0.104348,0,0,0.1,0,0)"/>
                        </g>
                    </svg>
                </div>
                <div class="item-remove flex-initial p-1 m-1" onclick="todoList.deleteListItem(this.parentElement.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
                        <path fill="#FC8181" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                    </svg>

                </div>
            </li>`;

        // insert the List Item, and clear out the input
        this.ul.insertAdjacentHTML('afterbegin', li);
        return listItem;
    }

    addListItemUI() {
        var inputElement = document.getElementById('list-input');
        var inputVal = inputElement.value;
        if (!inputVal) {
            return;
        }
        var listItem = this.addListItem(inputVal);
        inputElement.value = "";

        this.computeButtonState();
        console.log("added list item", listItem.id);
    }

    deleteListItem(id) {
        var li = document.getElementById(id);
        if (li) {
            this._deleteListItem(id);
            li.remove();
        }
        this.computeButtonState();
        console.log("removing list item", id);
    };

    editListItem(id) {
        var li = document.getElementById(id);
        if (!li) {
            return;
        }
        
        // don't do anything if there's already an input
        var inputDiv = li.getElementsByClassName('list-item-input')[0];
        if (inputDiv) {
            return;
        }

        // create a new Input div with value set to the list item text
        var textDiv = li.getElementsByClassName('list-item-text')[0];
        var inputDiv = createElementFromHtml(
            `<div class="list-item-input flex-auto px-2 text-lg">
                <input class="w-full bg-transparent border-none text-gray-600 focus:outline-none" value="${textDiv.innerHTML.trim()}" type="text">
            </div>`
        );

        // move Cursor to end of input
        li.replaceChild(inputDiv, textDiv);
        inputDiv.getElementsByTagName('input')[0].focus();

        console.log("edited list item", id);
    }

    completeListItem(id) {
        var li = document.getElementById(id);
        if (li) {
            li.classList.add("opacity-50");

            // add a strikethrough to the text
            var text = li.getElementsByClassName('list-item-text')[0];
            text.style.setProperty("text-decoration", "line-through");

            this._completeListItem(id);
        }
    }

    toggleCheck(id) {
        var li = document.getElementById(id);
        var checkbox = li.getElementsByClassName('list-item-check')[0];

        var listItem = this._getListItem(li.id);
        if (checkbox.checked) {
            li.classList.add("bg-blue-200");
            listItem.setChecked();
        } else {
            li.classList.remove("bg-blue-200");
            listItem.setNotChecked();
        }

        this.computeButtonState();
    }

    /**
     * Methods for controlling Bulk Action buttons
     */
    toggleListItems(shouldSelect) {
        var collection = this.ul.getElementsByTagName('li');
        for (var li of collection) {
            if (li) {
                var checkbox = li.getElementsByClassName('list-item-check')[0];

                var listItem = this._getListItem(li.id);
                if (shouldSelect) {
                    li.classList.add("bg-blue-200");
                    checkbox.checked = true;
                    listItem.setChecked();
                } else {
                    li.classList.remove("bg-blue-200");
                    checkbox.checked = false;
                    listItem.setNotChecked();
                }
            }
        }

        this.computeButtonState();
    }

    disableSelected() {
        var checkedItems = this._getCheckedItems();
        if (checkedItems && checkedItems.length > 0) {
            checkedItems.forEach(item => {
                var li = document.getElementById(item.id);
                li.classList.add("opacity-50");

                // add a strikethrough to the text
                var text = li.getElementsByClassName('list-item-text')[0];
                text.style.setProperty("text-decoration", "line-through");
                this._completeListItem(item.id);
            });
        }

        this.toggleListItems(false);
    }

    deleteSelected() {
        var checkedItems = this._getCheckedItems();
        if (checkedItems && checkedItems.length > 0) {
            checkedItems.forEach(item => {
                var li = document.getElementById(item.id);
                this.deleteListItem(li.id);
                item.state = "deleted";
            });
        }
    }

    computeButtonState() {
        var checkedItems = this._getCheckedItems();

        var numListItems = this.listItems.length;
        var numCheckedItems = checkedItems.length;

        if (numListItems === 0) {
            [this.btnSelectAll, this.btnDeselectAll, this.btnMarkComplete, this.btnDeleteSelected].forEach(btn => {
                btn.classList.add("cursor-not-allowed");
                btn.classList.add("opacity-50");
            });
        } else if (numListItems > 0 && numCheckedItems === 0) {
            this.btnSelectAll.classList.remove("opacity-50");
            this.btnSelectAll.classList.remove("cursor-not-allowed");
            [this.btnDeselectAll, this.btnMarkComplete, this.btnDeleteSelected].forEach(btn => {
                btn.classList.add("opacity-50");
                btn.classList.add("cursor-not-allowed");
            });
        } else if (numListItems === numCheckedItems) {
            this.btnSelectAll.classList.add("opacity-50");
            this.btnSelectAll.classList.add("cursor-not-allowed");
            [this.btnDeselectAll, this.btnMarkComplete, this.btnDeleteSelected].forEach(btn => {
                btn.classList.remove("opacity-50");
                btn.classList.remove("cursor-not-allowed");
            });
        } else {
            [this.btnSelectAll, this.btnDeselectAll, this.btnMarkComplete, this.btnDeleteSelected].forEach(btn => {
                btn.classList.remove("opacity-50");
                btn.classList.remove("cursor-not-allowed");
            });
        }
    }
    
    /**
     * Debugging Helpers
     */
    dumpEntries() {
        this.listItems.forEach((item) => {
            console.log(item.dump());
        });
    }
    dumpListItems() {
        return this.listItems;
    }
}

var ul = document.querySelector('#todo-list');
var btnGroup = document.querySelector('#bulk-actions');
var todoList = new TodoList(ul, btnGroup);


/**
 * Save the state to localStorage before unload
 */
window.addEventListener(
    'beforeunload',
    function (e) {
        var jsonString = JSON.stringify(todoList.dumpListItems());
        localStorage.setItem("MinimalList", jsonString);
        return null;
    }
);

/**
 * When the List Item is being edited and we click away,
 * we want to convert the <input> back into a text <div>
 * with the updated value.
 */
todoList.ul.addEventListener(
    'focusout',
    function (e) {
        if (!e.target) {
            return;
        }

        if (e.target.nodeName === "INPUT" && e.target.type !== "checkbox") {
            var input = e.target;
            var itemInput = input.parentElement;
            var li = itemInput.parentElement;

            // create a new List Item Text using Item Input value
            var itemText = createElementFromHtml(
                `<div class="list-item-text flex-auto px-2 text-lg text-gray-700">
                    ${input.value}
                </div>`
            );
            li.replaceChild(itemText, itemInput);

            // TODO: SHOULDN'T BE PRIVATE if we're updating state like this!
            todoList._updateListItem(li.id, input.value);
        }
    }
);
