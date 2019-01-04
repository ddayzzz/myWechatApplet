/*
 * 
 * WordPres版微信小程序
 * author: jianbo
 * organization: 守望轩  www.watch-life.net
 * github:    https://github.com/iamxjb/winxin-app-watch-life.net
 * 技术支持微信号：iamxjb
 * 开源协议：MIT
 * Copyright (c) 2017 https://www.watch-life.net All rights reserved.
 * 
 */

var Api = require('../../utils/api.js');
var util = require('../../utils/util.js');
var WxParse = require('../../wxParse/wxParse.js');
var auth = require('../../utils/auth.js');
import config from '../../utils/config.js'
var app = getApp();


Page({
	data: {
		title: '页面内容',
		pageData: {},
		pagesList: {},
		display: 'none',
		wxParseData: [],
		dialog: {
			title: '',
			content: '',
			hidden: true
		},
		userInfo: app.globalData.userInfo,
		isLoginPopup: false


	},
	onLoad: function (options) {
		wx.setNavigationBarTitle({
			title: '关于WordPress微信小程序',
			success: function (res) {
				// success
			}
		});

		this.fetchData(config.getAboutId);
	},
	praise: function () {
		var self = this;
		var src = config.getZanImageUrl;
		wx.previewImage({
			urls: [src],
		});
	},
	onPullDownRefresh: function () {
		var self = this;
		self.setData({
			display: 'none',
			pageData: {},
			wxParseData: {},

		});

		this.fetchData(config.getAboutId);
		//消除下刷新出现空白矩形的问题。
		wx.stopPullDownRefresh()

	},
	onShareAppMessage: function () {
		return {
			title: '关于“' + config.getWebsiteName + '”官方小程序',
			path: 'pages/about/about',
			success: function (res) {
				// 转发成功
			},
			fail: function (res) {
				// 转发失败
			}
		}
	},
	//给a标签添加跳转和复制链接事件
	wxParseTagATap: function (e) {
		var self = this;
		var href = e.currentTarget.dataset.src;
		console.log(href);
		var domain = config.getDomain;
		//我们可以在这里进行一些路由处理
		if (href.indexOf(domain) == -1) {
			wx.setClipboardData({
				data: href,
				success: function (res) {
					wx.getClipboardData({
						success: function (res) {
							wx.showToast({
								title: '链接已复制',
								//icon: 'success',
								image: '../../images/link.png',
								duration: 2000
							})
						}
					})
				}
			})
		}
		else {
			var slug = util.GetUrlFileName(href, domain);
			if (slug == 'index') {
				wx.switchTab({
					url: '../index/index'
				})
			}
			else {
				var getPostSlugRequest = Api.getRequest(Api.getPostBySlug(slug));
				getPostSlugRequest
					.then(res => {
						var postID = res.data[0].id;
						var openLinkCount = wx.getStorageSync('openLinkCount') || 0;
						if (openLinkCount > 4) {
							wx.redirectTo({
								url: '../detail/detail?id=' + postID
							})
						}
						else {
							wx.navigateTo({
								url: '../detail/detail?id=' + postID
							})
							openLinkCount++;
							wx.setStorageSync('openLinkCount', openLinkCount);
						}

					})

			}

		}

	},
	userAuthorization: function () {
		var self = this;
		// 判断是否是第一次授权，非第一次授权且授权失败则进行提醒
		wx.getSetting({
			success: function success(res) {
				console.log(res.authSetting);
				var authSetting = res.authSetting;
				if (!('scope.userInfo' in authSetting)) {
					//if (util.isEmptyObject(authSetting)) {
					console.log('第一次授权');
					self.setData({ isLoginPopup: true })

				} else {
					console.log('不是第一次授权', authSetting);
					// 没有授权的提醒
					if (authSetting['scope.userInfo'] === false) {
						wx.showModal({
							title: '用户未授权',
							content: '如需正常使用评论、点赞、赞赏等功能需授权获取用户信息。是否在授权管理中选中“用户信息”?',
							showCancel: true,
							cancelColor: '#296fd0',
							confirmColor: '#296fd0',
							confirmText: '设置权限',
							success: function (res) {
								if (res.confirm) {
									console.log('用户点击确定')
									wx.openSetting({
										success: function success(res) {
											console.log('打开设置', res.authSetting);
											var scopeUserInfo = res.authSetting["scope.userInfo"];
											if (scopeUserInfo) {
												auth.getUsreInfo(null);
											}
										}
									});
								}
							}
						})
					}
					else {
						auth.getUsreInfo(null);

					}
				}
			}
		});
	},
	agreeGetUser: function (e) {
		var userInfo = e.detail.userInfo;
		var self = this;
		if (userInfo) {
			auth.getUsreInfo(e.detail);
			self.setData({ userInfo: userInfo });
		}
		setTimeout(function () {
			self.setData({ isLoginPopup: false })
		}, 1200);
	},
	closeLoginPopup() {
		this.setData({ isLoginPopup: false });
	},
	openLoginPopup() {
		this.setData({ isLoginPopup: true });
	},
	fetchData: function (id) {
		var self = this;
		var getPageRequest = Api.getRequest(Api.getPageByID(id));
		getPageRequest.then(response => {
			console.log(response);
			WxParse.wxParse('article', 'html', response.data.content.rendered, self, 5);

			self.setData({
				pageData: response.data,
				// wxParseData: WxParse('md',response.data.content.rendered)
				//wxParseData: WxParse.wxParse('article', 'html', response.data.content.rendered, self, 5)
			});
			self.setData({
				display: 'block'
			});
		})
			.then(res => {
				if (!app.globalData.isGetOpenid) {
					// auth.getUsreInfo();
				}
			})
	}
})