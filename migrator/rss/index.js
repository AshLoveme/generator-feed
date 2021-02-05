var extend = hexo.extend,
  util = hexo.util,
  file = util.file,
  feedparser = require('feedparser'),
  moment = require('moment'),
  async = require('async'),
  _ = require('underscore'),
  tomd = require('to-markdown').toMarkdown;

extend.migrator.register('rss', function(args){
  var source = args.shift(),
    target = hexo.source_dir + '_posts/';

  if (!source){
    console.log('\nUsage: hexo migrate rss <source>\n\nMore info: http://zespia.tw/hexo/docs/migrate.html\n');
  } else {
    async.waterfall([
      function(next){
        console.log('Fetching %s.', source);

        // URL regular expression from: http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
        if (source.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/)){
          feedparser.parseUrl(source, next);
        } else {
          feedparser.parseFile(source, next);
        }
      },
      function(meta, posts, next){
        console.log('Analyzing.');

        async.forEach(posts, function(item, next){
          var postLink = (item.origlink ? item.origlink : item.link).split('/').reverse()[0];
          if (!postLink) postLink = item.title.toLowerCase().split(' ').join('-');

          if (item.categories){
            if (_.isArray(item.categories)){
              var tags = '\n- ' + item.categories.join('\n- ');
            } else {
              var tags = item.categories.toString();
            }
          }

          var content = [
            '---',
            'layout: post',
            'title: ' + item.title,
            'date: ' + moment(item.pubdate).format('YYYY-MM-DD HH:mm:ss'),
            'comments: true',
            'tags: ' + (tags ? tags : '')
            '---',
          ];

          file.write(target + postLink + '.md', content.join('\n') + '\n\n' + tomd(item.description), next);
        }, function(){
          next(null, posts.length);
        });
      }
    ], function(err, length){
      if (err) throw err;
      console.log('%d posts migrated.', length);
    });
  }
});