---
layout: default
title: 技術ブログ
---

# 技術ブログ

<p>要求の構造化、妥当性チェック、自動修正、テスト連携など、実装のコツや事例を発信します。</p>

<h2>最新記事</h2>
<ul>
{% for post in site.posts %}
  <li>
    <a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a>
    <small> - {{ post.date | date: "%Y年%m月%d日" }}</small>
    {% if post.tags %}
      <br><small>Tags:
      {% for t in post.tags %}
        <a href="#tag-{{ t | slugify }}">{{ t }}</a>{% unless forloop.last %}, {% endunless %}
      {% endfor %}
      </small>
    {% endif %}
  </li>
{% endfor %}
</ul>

<hr>

<h2>タグ</h2>
{% assign all_tags = site.posts | map: 'tags' | uniq | join: ',' | split: ',' | uniq | sort %}
<ul>
{% for tag in all_tags %}
  {% assign tag_trim = tag | strip %}
  {% if tag_trim != "" %}
  <li id="tag-{{ tag_trim | slugify }}"><strong>{{ tag_trim }}</strong>
    <ul>
    {% assign tagged = site.posts | where_exp: "p", "p.tags contains tag_trim" %}
    {% for p in tagged %}
      <li><a href="{{ site.baseurl }}{{ p.url }}">{{ p.title }}</a> <small>({{ p.date | date: "%Y年%m月%d日" }})</small></li>
    {% endfor %}
    </ul>
  </li>
  {% endif %}
{% endfor %}
</ul>

<hr>

<p><a href="{{ site.baseurl }}/">← ホームに戻る</a></p>
