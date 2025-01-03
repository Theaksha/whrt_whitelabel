# -*- coding: utf-8 -*-
from setuptools import setup, find_packages



# get version from __version__ variable in whitelabel/__init__.py
from whrt_whitelabel import __version__ as version

setup(
	name='whrt_whitelabel',
	version=version,
	description='Whrt Whitelabel',
	author='WhiteRaysTechnology',
	author_email='akshaymaske517@gmail.com',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=[
        'tqdm'
    ],
)
