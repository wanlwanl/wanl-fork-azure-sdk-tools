$(() => {
  // Search
  const defaultPageSize = 50;
  const reviewsFilterPartial = $( '#reviews-filter-partial' );
  const languageFilter = $( '#language-filter-bootstraps-select' );
  const stateFilter = $( '#state-filter-bootstraps-select' );
  const statusFilter = $( '#status-filter-bootstraps-select' );
  const typeFilter = $( '#type-filter-bootstraps-select' );
  const searchNameExact = $('#reviews-table-search-name-exact');
  const searchNameLoose = $('#reviews-table-search-name-loose');
  const searchAuthor = $('#reviews-table-search-author');
  const searchPrNo = $('#reviews-table-search-pr-no');
  const searchButton = $( '#reviews-search-button' );
  const resetButton = $( '#reset-filter-button' );

  // Import underscorejs
  var _ = require('underscore');

  // Enable tooltip
  (<any>$('[data-toggle="tooltip"]')).tooltip();

  // Computes the uri string using the values of search, pagination and various filters
  // Invokes partial page update to list of reviews using ajax
  // Updates the uri displayed on the client
  function updateListedReviews({ pageNo = 1, pageSize = defaultPageSize } = {})
  {
    var uri = '?handler=reviewspartial';
    var nameQueryExact = searchNameExact.val() as string;
    var nameQueryLoose = searchNameLoose.val() as string;
    var authorQuery = searchAuthor.val() as string;
    var prNoQuery = searchPrNo.val() as string;

    if (nameQueryExact != null && nameQueryExact.trim() != '')
    {
      var searchTerms = nameQueryExact.trim().split(/\s+/);
      searchTerms.forEach(function(value, index){
        uri = uri + '&nameExact=' + encodeURIComponent(value);
      });
    }

    if (nameQueryLoose != null && nameQueryLoose.trim() != '') {
      var searchTerms = nameQueryLoose.trim().split(/\s+/);
      searchTerms.forEach(function (value, index) {
        uri = uri + '&nameLoose=' + encodeURIComponent(value);
      });
    }

    if (authorQuery != null && authorQuery.trim() != '') {
      var searchTerms = authorQuery.trim().split(/\s+/);
      searchTerms.forEach(function (value, index) {
        uri = uri + '&author=' + encodeURIComponent(value);
      });
    }

    if (prNoQuery != null && prNoQuery.trim() != '') {
      var searchTerms = prNoQuery.trim().split(/\s+/);
      searchTerms.forEach(function (value, index) {
        uri = uri + '&prNo=' + encodeURIComponent(value);
      });
    }

    languageFilter.children(":selected").each(function() {
      uri = uri + '&languages=' + encodeURIComponent(`${$(this).val()}`);
    });
    
    stateFilter.children(":selected").each(function() {
      uri = uri + '&state=' + encodeURIComponent(`${$(this).val()}`);
    });

    statusFilter.children(":selected").each(function() {
      uri = uri + '&status=' + encodeURIComponent(`${$(this).val()}`);
    });

    typeFilter.children(":selected").each(function() {
      uri = uri + '&type=' + encodeURIComponent(`${$(this).val()}`);
    });

    uri = uri + '&pageNo=' + encodeURIComponent(pageNo);
    uri = uri + '&pageSize=' + encodeURIComponent(pageSize);
    uri = encodeURI(uri);

    $.ajax({
      url: uri
    }).done(function(partialViewResult) {
      reviewsFilterPartial.html(partialViewResult);
      history.pushState({}, '', uri.replace('handler=reviewspartial&', ''));
      addPaginationEventHandlers(); // This ensures that the event handlers are re-added after ajax refresh
    });
  }

  // Add custom behaviour and event to pagination buttons
  function addPaginationEventHandlers()
  {
    $( '.page-link' ).each(function() {
      $(this).on('click', function(event){
        event.preventDefault();
        var linkParts = $(this).prop('href').split('/');
        var pageNo = linkParts[linkParts.length - 1];
        if (pageNo !== null && pageNo !== undefined)
        {
          updateListedReviews({ pageNo: pageNo });
        }
      });
    });
  }

  // Triggers partial page update to retriev properties for poulating filter dropdowns
  function updateFilterDropDown(filter, query)
  {
    // update tags dropdown select
    var uri = `?handler=reviews${query}`;
    var urlParams = new URLSearchParams(location.search);
    if (urlParams.has(query))
    {
      urlParams.getAll(query).forEach(function(value, index) {
        uri = uri + `&selected${query}=` + encodeURIComponent(value);
      });
    }
    $.ajax({
      url: uri
    }).done(function(partialViewResult) {
      filter.html(partialViewResult);
      (<any>filter).selectpicker('refresh');
    });
  }

  // Update content of dropdown on page load
  $(document).ready(function() {
    updateFilterDropDown(languageFilter, "languages");
    addPaginationEventHandlers();
  });


  // Update when any dropdown is changed
  [languageFilter, stateFilter, statusFilter, typeFilter].forEach(function(value, index) {
    value.on('hidden.bs.select', function() {
      updateListedReviews();
    });
  });

  [searchNameExact, searchNameLoose, searchAuthor, searchPrNo].forEach(function (value, index) {
    value.on('input', _.debounce(function (e) {
      updateListedReviews();
    }, 300));
  });

  searchButton.on('click', function() {
    updateListedReviews();
  });

  resetButton.on('click', function(e) {
    (<any>languageFilter).selectpicker('deselectAll');
    (<any>stateFilter).selectpicker('deselectAll').selectpicker('val', 'Open');
    (<any>statusFilter).selectpicker('deselectAll');
    (<any>typeFilter).selectpicker('deselectAll');
    searchNameExact.val('');
    searchNameLoose.val('');
    searchAuthor.val('');
    searchPrNo.val('');
    updateListedReviews();
  });
});
