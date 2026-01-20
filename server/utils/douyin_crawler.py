#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Douyin爬虫集成脚本
用于从抖音链接提取视频信息
"""

import sys
import json
import asyncio
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from crawlers.hybrid.hybrid_crawler import HybridCrawler


async def fetch_douyin_video_info(url: str) -> dict:
    """
    获取抖音视频信息
    
    Args:
        url: 抖音视频链接
        
    Returns:
        dict: 视频信息，包含标题、描述、作者等
    """
    try:
        print(f"[DouyinCrawler] 开始爬取: {url}", file=sys.stderr)
        
        crawler = HybridCrawler()
        
        # 使用混合爬虫获取视频信息
        result = await crawler.hybrid_parsing_single_video(url, minimal=False)
        
        print(f"[DouyinCrawler] 成功获取视频信息", file=sys.stderr)
        
        # 提取关键信息
        video_info = {
            'success': True,
            'platform': result.get('platform'),
            'title': result.get('title', ''),
            'description': result.get('desc', ''),
            'author': result.get('author', {}).get('nickname', ''),
            'author_id': result.get('author', {}).get('id', ''),
            'video_id': result.get('video_id', ''),
            'duration': result.get('duration', 0),
            'like_count': result.get('statistics', {}).get('like_count', 0),
            'comment_count': result.get('statistics', {}).get('comment_count', 0),
            'share_count': result.get('statistics', {}).get('share_count', 0),
            'play_count': result.get('statistics', {}).get('play_count', 0),
            'create_time': result.get('create_time', 0),
            'video_url': result.get('video', {}).get('download_addr', ''),
            'cover_url': result.get('video', {}).get('cover', ''),
        }
        
        return video_info
        
    except Exception as e:
        print(f"[DouyinCrawler] 错误: {str(e)}", file=sys.stderr)
        return {
            'success': False,
            'error': str(e)
        }


async def main():
    """
    主函数
    从命令行参数获取URL并爬取信息
    """
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': '缺少URL参数'
        }))
        sys.exit(1)
    
    url = sys.argv[1]
    result = await fetch_douyin_video_info(url)
    
    # 输出JSON结果到stdout
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    asyncio.run(main())
