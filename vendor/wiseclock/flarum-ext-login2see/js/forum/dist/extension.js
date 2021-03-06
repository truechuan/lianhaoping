System.register('wiseclock/flarum-ext-login2see/main', ['flarum/extend', 'flarum/app', 'flarum/components/CommentPost', 'flarum/components/HeaderPrimary', 'flarum/components/LogInModal', 'flarum/components/SignUpModal'], function (_export) {
    'use strict';

    var extend, override, app, CommentPost, HeaderPrimary, LogInModal, SignUpModal;
    return {
        setters: [function (_flarumExtend) {
            extend = _flarumExtend.extend;
            override = _flarumExtend.override;
        }, function (_flarumApp) {
            app = _flarumApp['default'];
        }, function (_flarumComponentsCommentPost) {
            CommentPost = _flarumComponentsCommentPost['default'];
        }, function (_flarumComponentsHeaderPrimary) {
            HeaderPrimary = _flarumComponentsHeaderPrimary['default'];
        }, function (_flarumComponentsLogInModal) {
            LogInModal = _flarumComponentsLogInModal['default'];
        }, function (_flarumComponentsSignUpModal) {
            SignUpModal = _flarumComponentsSignUpModal['default'];
        }],
        execute: function () {

            app.initializers.add('wiseclock-login2see', function () {
                var wiseclockLogin2seeUsePHP = undefined;
                var wiseclockLogin2seePostsLength = undefined;
                var wiseclockLogin2seeReplaceLinks = undefined;
                var wiseclockLogin2seeReplaceImages = undefined;
                var wiseclockLogin2seeImgMin = 150;

                // http://stackoverflow.com/questions/6003271/substring-text-with-html-tags-in-javascript/6003713#6003713
                function html_substr(str, count) {
                    var div = document.createElement('div');
                    div.innerHTML = str;
                    walk(div, track);

                    function track(el) {
                        if (count > 0) {
                            var len = el.data.length;
                            count -= len;
                            if (count <= 0 && el && el.data) el.data = el.substringData(0, el.data.length + count) + '...';
                        } else {
                            if (el && el.data) el.data = '';
                        }
                    }

                    function walk(el, fn) {
                        var node = el.firstChild;
                        if (el.innerHTML && count <= 0) el.innerHTML = '';
                        do {
                            if (node.nodeType === 3) fn(node);else if (node.nodeType === 1 && node.childNodes && node.childNodes[0]) walk(node, fn);
                        } while (node = node.nextSibling);
                    }

                    return div.innerHTML;
                }

                function html_count(str) {
                    var div = document.createElement("div");
                    div.innerHTML = str;
                    var text = div.textContent || div.innerText || "";
                    return text.length;
                }

                extend(HeaderPrimary.prototype, 'init', function () {
                    wiseclockLogin2seePostsLength = parseInt(app.forum.attribute('wiseclock.login2see.post') || 100);
                    if (isNaN(wiseclockLogin2seePostsLength)) wiseclockLogin2seePostsLength = -1;
                    wiseclockLogin2seeReplaceLinks = app.forum.attribute('wiseclock.login2see.link') || 'replace_address';
                    wiseclockLogin2seeReplaceImages = JSON.parse(app.forum.attribute('wiseclock.login2see.image') || 0);
                    wiseclockLogin2seeUsePHP = JSON.parse(app.forum.attribute('wiseclock.login2see.php') || 0);
                });

                extend(CommentPost.prototype, 'content', function (list) {
                    if (app.session.user || this.isEditing()) return;

                    if (wiseclockLogin2seeUsePHP) return;

                    var oldContent = list[1].children[0].toString();
                    var newContent = oldContent;
                    var subbedContent = false;

                    // hide content
                    if (wiseclockLogin2seePostsLength != -1 && html_count(newContent) > wiseclockLogin2seePostsLength) {
                        try {
                            newContent = html_substr(newContent, wiseclockLogin2seePostsLength);
                        } catch (ex) {}
                        subbedContent = true;
                    }

                    // replace links
                    if (wiseclockLogin2seeReplaceLinks != 'no_replace') newContent = newContent.replace(/<a href=".*?"/g, '<a');
                    if (wiseclockLogin2seeReplaceLinks == 'replace_all') newContent = newContent.replace(/(<a[^>]*>)[^<]*<\/a>/g, '$1' + app.translator.trans('wiseclock-login2see.forum.link') + '</a>');

                    // replace images
                    if (wiseclockLogin2seeReplaceImages) {
                        (function () {
                            var imgCounter = 0;
                            newContent = newContent.replace(/<img[^>]*>/g, function (html) {
                                var img = $(html)[0];
                                var src = img.src;

                                var loader = new Image();
                                loader.onload = function () {
                                    var imgWidth = loader.width;
                                    var imgHeight = loader.height;
                                    imgWidth = imgWidth > wiseclockLogin2seeImgMin ? imgWidth : wiseclockLogin2seeImgMin;
                                    imgHeight = imgHeight > wiseclockLogin2seeImgMin ? imgHeight : wiseclockLogin2seeImgMin;
                                    $('.wlip' + this.counter).width(imgWidth);
                                    $('.wlip' + this.counter).height(imgHeight);
                                };

                                loader.counter = imgCounter;
                                loader.src = src;

                                return '<div class="wiseclockLogin2seeImgPlaceholder wlip' + imgCounter++ + '">' + app.translator.trans('wiseclock-login2see.forum.image') + '</div>';
                            });
                        })();
                    }

                    if (subbedContent) newContent += '<div class="wiseclockLogineseeAlert">' + app.translator.trans('wiseclock-login2see.forum.post', {
                        login: "<a class='wiseclockLogin2seeLogin'>" + app.translator.trans('core.forum.header.log_in_link') + "</a>",
                        register: "<a class='wiseclockLogin2seeRegister'>" + app.translator.trans('core.forum.header.sign_up_link') + "</a>"
                    }).join('') + '</div>';

                    list[1].children[0] = m.trust(newContent);
                });

                extend(CommentPost.prototype, 'config', function () {
                    if (wiseclockLogin2seeReplaceLinks != 'no_replace') $('.Post-body a').off('click').on('click', function () {
                        return app.modal.show(new LogInModal());
                    });
                    $('.wiseclockLogin2seeLogin').off('click').on('click', function () {
                        return app.modal.show(new LogInModal());
                    });
                    $('.wiseclockLogin2seeRegister').off('click').on('click', function () {
                        return app.modal.show(new SignUpModal());
                    });
                });
            });
        }
    };
});