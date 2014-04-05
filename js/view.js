App.CalendarView = Backbone.View.extend({
  initialize: function() {
    this.listenTo(this.collection, 'add change', this.render);
    this.listenTo(App.mediator, 'calendar:prev', this.toPrev);
    this.listenTo(App.mediator, 'calendar:next', this.toNext);
    this.listenTo(App.mediator, 'calendar:today', this.toToday);
  },
  render: function() {
    var $caption = this.$('caption');
    var $tbody = this.$('tbody');
    var current = moment();
    var currentDay = this.current.clone().startOf('month').startOf('week');
    var endDay = this.current.clone().endOf('month');

    $tbody.empty();
    $caption.text(this.current.format('YYYY年MM月'));

    while (currentDay <= endDay) {
      var $tr = $('<tr>').appendTo($tbody);
      for (var i = 0; i < 7; i++) {
        var cell = new App.CalendarCellView({
          date: currentDay.clone(),
          collection: this.collection,
        });

        $tr.append(cell.el);
        currentDay.add(1, 'day');
      }
    }
  },
  toPrev: function() {
    this.current.subtract(1, 'month');
    this.render();
    this.routeToCurrent();
  },
  toNext: function() {
    this.current.add(1, 'month');
    this.render();
    this.routeToCurrent();
  },
  toToday: function() {
    this.current = moment();
    this.render();
    App.mediator.trigger('route:change');
  },
  moveTo: function(year, month) {
    this.current = moment({ year: year, month: month - 1 });
    this.render();
    this.routeToCurrent();
  },
  routeToCurrent: function() {
    App.mediator.trigger('route:change', this.current.format('YYYY/MM'));
  }
});

App.CalendarCellView = Backbone.View.extend({
  tagName: 'td',

  template: 
    '<div class="calendar-date"><%= date.format("MM/DD") %></div>' + '<ul class="calendar-list"></ul>',

  initialize: function(options) {
    this.date = options.date;
    this.render();
  },
  render: function() {
    var html = _.template(this.template, {date: this.date});
    this.$el.html(html);

    var schedules = this.collection.findByDate(this.date);

    var $list = this.$('ul').empty();

    _.each(schedules, function(model) {
      var item = new App.CalendarItemView({ model: model });
      $list.append(item.el);
    }, this);
  }
});

App.CalendarItemView = Backbone.View.extend({
  tagName: 'li',

  events: {
    'click': 'onClick'
  },

  template:
    '<time><%= date %></time>' + '<span><%= title %></span>',

  initialize: function() {
    this.render();
  },
  render: function() {
    var html = _.template(this.template, {
      date: this.model.dateFormat('HH:mm'),
      title: this.model.get('title')
    });

    this.$el.html(html);
  },

  onClick: function() {
    App.mediator.trigger('dialog:open', this.model);
  }
});

App.FormDialogView = Backbone.View.extend({
  events: {
    'submit form': 'onSubmit',
    'click .dialog-close': 'close'
  },

  initialize: function() {
    this.listenTo(this.collection, 'add change', this.close);
    this.listenTo(this.collection, 'invalid', this.onError);
    this.listenTo(App.mediator, 'dialog:open', this.open);
  },
  render: function() {
    if (this.model) {
      this.$('input[name="title"]').val(this.model.get('title'));
      this.$('input[name="datetime"]').val(this.model.dateFormat('YYYY-MM-DDTHH:mm'));
      this.$('.dialog-removeBtn').show();
    } else {
      this.$('input[name="title"]').val('');
      this.$('input[name="datetime"]').val('');
      this.$('.dialog-removeBtn').hide();
    }

    this.$el.show();
  },
  open: function(model) {
    this.model = model;
    this.render();
  },
  close: function() {
    this.$el.hide();
  },
  onSubmit: function(e) {
    e.preventDefault();

    var title = this.$('input[name="title"]').val();
    var datetime = this.$('input[name="datetime"]').val();
    var params = {
      title: title,
      datetime: moment(datetime)
    };

    if (this.model) {
      this.model.save(params, { validate: true });
    } else {
      this.collection.create(params, { validate: true })
    }
  },
  onError: function(model, message) {
    alert(message);
  }
});

App.CalendarControlView = Backbone.View.extend({
  events: {
    'click .calendar-newBtn': 'onClickNew',
    'click .calendar-prevBtn': 'onClickPrev',
    'click .calendar-nextBtn': 'onClickNext',
    'click .calendar-todayBtn': 'onClickToday',
  },
  onClickNew: function() {
    App.mediator.trigger('dialog:open');
  },
  onClickPrev: function() {
    App.mediator.trigger('calendar:prev');
  },
  onClickNext: function() {
    App.mediator.trigger('calendar:next');
  },
  onClickToday: function() {
    App.mediator.trigger('calendar:today');
  }
});
