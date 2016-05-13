define(function (require) {
    var ViewManager = require('views/viewManager');
    var LoginView = require('views/login');
    var RegView = require('views/register');


    QUnit.module("views/manager");

    QUnit.test("ViewManager - экземпляр Backbone.View", function () {

        var ViewManager = require('views/viewManager');
        var viewManager = new ViewManager();

        QUnit.ok(viewManager instanceof Backbone.View);

    });

    QUnit.test("Logic test for ViewManager", function () {

        var views = {
                login: LoginView,
                reg: RegView
            },
            viewManager = new ViewManager(views);

        QUnit.equal(views['login'].$el.css('display') === 'none', true);
        QUnit.equal(views['reg'].$el.css('display') === 'none', true);

        views['login'].show();

        QUnit.equal(views['login'].$el.css('display') === 'none', false);
        QUnit.equal(views['reg'].$el.css('display') === 'none', true);

        views['reg'].show();

        QUnit.equal(views['login'].$el.css('display') === 'none', true);
        QUnit.equal(views['reg'].$el.css('display') === 'none', false);

    });

});