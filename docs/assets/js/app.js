window.switchTab = (tabGroup, tabId) => {
  const allTabItems = Array.from(
    document.querySelectorAll("[data-tab-group='" + tabGroup + "']")
  );
  const targetTabItems = Array.from(
    document.querySelectorAll(
      "[data-tab-group='" + tabGroup + "'][data-tab-item='" + tabId + "']"
    )
  );

  // if event is undefined then switchTab was called from restoreTabSelection
  // so it's not a button event and we don't need to safe the selction or
  // prevent page jump
  var isButtonEvent = event != undefined;

  if (isButtonEvent) {
    // save button position relative to viewport
    var yposButton = event.target.getBoundingClientRect().top;
  }

  allTabItems.forEach((x) => {
    x.classList.remove("active");
  });
  targetTabItems.forEach((x) => {
    x.classList.add("active");
  });

  if (isButtonEvent) {
    // reset screen to the same position relative to clicked button to prevent page jump
    var yposButtonDiff = event.target.getBoundingClientRect().top - yposButton;
    window.scrollTo(window.scrollX, window.scrollY + yposButtonDiff);

    // Store the selection to make it persistent
    if (window.localStorage) {
      const selectionsJSON = window.localStorage.getItem("tabSelections");
      let tabSelections = {};
      if (selectionsJSON) {
        tabSelections = JSON.parse(selectionsJSON);
      }
      tabSelections[tabGroup] = tabId;
      window.localStorage.setItem(
        "tabSelections",
        JSON.stringify(tabSelections)
      );
    }
  }
};

window.restoreTabSelections = () => {
  if (window.localStorage) {
    const selectionsJSON = window.localStorage.getItem("tabSelections");
    let tabSelections = {};
    if (selectionsJSON) {
      tabSelections = JSON.parse(selectionsJSON);
    }
    Object.keys(tabSelections).forEach((tabGroup) => {
      var tabItem = tabSelections[tabGroup];
      window.switchTab(tabGroup, tabItem);
    });
  }
};
