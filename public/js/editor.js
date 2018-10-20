window.onload = function() {
    new Vue({
      el: '#editor',
      data: {
        input: '# Welcome! \n\n ## Welcome! \n\n- Welcome!',
      },
      filters: {
        marked: marked,
      },
    });
  };

