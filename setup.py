# -*- coding: utf-8 -*-
from setuptools import setup, find_packages
from setuptools.command.install import install
import subprocess


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
	entry_points={
        'bench.commands': [
            'get-app = whrt_whitelabel.commands.get_app:get_app',
        ]
	},
	cmdclass={
        'install': CustomInstallCommand,
    },
	install_requires=[
        'tqdm'
    ],
)
